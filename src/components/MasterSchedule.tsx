import { useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Search, AlertTriangle, ArrowRightLeft, Clock, ScrollText, Loader2, AlertCircle } from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = "In Field" | "Queued" | "Completed";
type EquipmentType = "all" | "heavy" | "light";
type ResolveMode = "reassign" | "adjust";

interface ScheduleEntry {
  id: string;
  time: string;
  timeSlot: string;
  farmer: string;
  equipment: string;
  equipmentId: string;
  status: Status;
  type: EquipmentType;
}

interface AuditEntry {
  timestamp: Date;
  farmer: string;
  action: ResolveMode;
  from: string;
  to: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const HEAVY = ["TRACTOR", "HAND TRACTOR", "RICE THRESHER", "ROTAVATOR", "HARVESTER", "COMBINE HARVESTER"];

function equipmentType(name: string): EquipmentType {
  return HEAVY.some((h) => name.toUpperCase().includes(h)) ? "heavy" : "light";
}

function dbStatusToDisplay(status: string): Status {
  if (status === "Ongoing") return "In Field";
  if (status === "Confirmed") return "Queued";
  return "Completed";
}

const timeOptions = [
  "06:00 AM","07:00 AM","08:00 AM","09:00 AM","10:00 AM",
  "11:00 AM","12:00 PM","01:00 PM","02:00 PM","03:00 PM",
  "04:00 PM","05:00 PM","06:00 PM",
];

function parseTime(t: string): number {
  const [time, period] = t.trim().split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function getSlotRange(slot: string): [number, number] | null {
  const match = slot.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*[–-]\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
  if (!match) return null;
  return [parseTime(match[1]), parseTime(match[2])];
}

function findConflicts(entries: ScheduleEntry[]): Map<number, string[]> {
  const conflicts = new Map<number, string[]>();
  for (let i = 0; i < entries.length; i++) {
    const rangeA = getSlotRange(entries[i].timeSlot);
    if (!rangeA) continue;
    for (let j = i + 1; j < entries.length; j++) {
      if (entries[i].equipment !== entries[j].equipment) continue;
      const rangeB = getSlotRange(entries[j].timeSlot);
      if (!rangeB) continue;
      if (rangeA[0] < rangeB[1] && rangeB[0] < rangeA[1]) {
        conflicts.set(i, [...(conflicts.get(i) || []), `Conflicts with ${entries[j].farmer}`]);
        conflicts.set(j, [...(conflicts.get(j) || []), `Conflicts with ${entries[i].farmer}`]);
      }
    }
  }
  return conflicts;
}

const statusStyles: Record<Status, string> = {
  "In Field": "bg-primary/10 text-primary border-primary/20",
  Queued: "bg-warning/10 text-warning border-warning/20",
  Completed: "bg-muted text-muted-foreground border-border",
};

// ── Supabase fetch: today's schedule ─────────────────────────────────────────

async function fetchTodaySchedule(): Promise<ScheduleEntry[]> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("transactions")
    .select("id, status, start_date, farmers ( alias ), equipment ( id, name )")
    .or(`status.eq.Confirmed,status.eq.Ongoing`)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((t: any) => ({
    id: t.id,
    time: "06:00 AM",
    timeSlot: "06:00 AM – 05:00 PM (Whole Day)",
    farmer: t.farmers?.alias ?? "Unknown",
    equipment: t.equipment?.name ?? "Unknown",
    equipmentId: t.equipment?.id ?? "",
    status: dbStatusToDisplay(t.status),
    type: equipmentType(t.equipment?.name ?? ""),
  }));
}

async function fetchAllEquipment(): Promise<string[]> {
  const { data } = await supabase.from("equipment").select("name").eq("status", "Available");
  return (data ?? []).map((e: any) => e.name);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MasterSchedule() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EquipmentType>("all");
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveMode, setResolveMode] = useState<ResolveMode>("reassign");
  const [newEquipment, setNewEquipment] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedule = [], isLoading, isError, error } = useQuery({
    queryKey: ["schedule-today"],
    queryFn: fetchTodaySchedule,
    refetchInterval: 15_000,
  });

  const { data: allEquipment = [] } = useQuery({
    queryKey: ["equipment-names"],
    queryFn: fetchAllEquipment,
  });

  // Mutation: reassign equipment on a transaction
  const reassignMutation = useMutation({
    mutationFn: async ({ txId, equipmentName }: { txId: string; equipmentName: string }) => {
      const { data: eq } = await supabase
        .from("equipment").select("id").ilike("name", equipmentName).single();
      if (!eq) throw new Error("Equipment not found");
      const { error } = await supabase
        .from("transactions").update({ equipment_id: eq.id }).eq("id", txId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule-today"] }),
  });

  const conflicts = useMemo(() => findConflicts(schedule), [schedule]);

  const filtered = useMemo(() => {
    return schedule.filter((row) => {
      const matchesSearch = row.farmer.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || row.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [search, typeFilter, schedule]);

  const openResolve = useCallback((id: string) => {
    const entry = schedule.find((s) => s.id === id);
    if (!entry) return;
    setResolveId(id);
    setNewEquipment(entry.equipment);
    setNewStart("06:00 AM");
    setNewEnd("05:00 PM");
    setResolveMode("reassign");
    setResolveOpen(true);
  }, [schedule]);

  const handleResolve = useCallback(async () => {
    if (!resolveId) return;
    const entry = schedule.find((s) => s.id === resolveId);
    if (!entry) return;

    if (resolveMode === "reassign") {
      await reassignMutation.mutateAsync({ txId: resolveId, equipmentName: newEquipment });
      setAuditLog((prev) => [{
        timestamp: new Date(), farmer: entry.farmer,
        action: "reassign", from: entry.equipment, to: newEquipment,
      }, ...prev]);
      toast({ title: "Equipment Reassigned", description: `${entry.farmer} moved to ${newEquipment}` });
    } else {
      const newSlot = `${newStart} – ${newEnd}`;
      setAuditLog((prev) => [{
        timestamp: new Date(), farmer: entry.farmer,
        action: "adjust", from: entry.timeSlot, to: newSlot,
      }, ...prev]);
      toast({ title: "Time Slot Adjusted (Local)", description: `${entry.farmer} rescheduled to ${newSlot}` });
    }

    setResolveOpen(false);
    setResolveId(null);
  }, [resolveId, resolveMode, newEquipment, newStart, newEnd, schedule, toast, reassignMutation]);

  const resolveEntry = resolveId ? schedule.find((s) => s.id === resolveId) : null;

  return (
    <div className="stat-card animate-slide-up" style={{ animationDelay: "300ms" }}>
      <h2 className="text-base font-semibold mb-4">Master Schedule — Today</h2>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search farmer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as EquipmentType)}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Equipment Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment</SelectItem>
            <SelectItem value="heavy">Heavy</SelectItem>
            <SelectItem value="light">Light</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Loading schedule...</span>
        </div>
      )}
      {isError && (
        <div className="flex items-center justify-center gap-2 py-8 text-destructive">
          <AlertCircle className="h-4 w-4" /><span className="text-sm">{(error as Error).message}</span>
        </div>
      )}

      {!isLoading && !isError && (
        <TooltipProvider>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left font-medium py-2.5 pr-4">Time</th>
                  <th className="text-left font-medium py-2.5 pr-4">Time Slot</th>
                  <th className="text-left font-medium py-2.5 pr-4">Farmer</th>
                  <th className="text-left font-medium py-2.5 pr-4">Equipment</th>
                  <th className="text-left font-medium py-2.5 pr-4">Status</th>
                  <th className="text-left font-medium py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const originalIdx = schedule.indexOf(row);
                  const rowConflicts = conflicts.get(originalIdx);
                  const hasConflict = !!rowConflicts;
                  return (
                    <tr key={row.id} className={`border-b border-border/50 last:border-0 transition-all duration-150 hover:bg-muted/50 hover:shadow-md cursor-pointer ${hasConflict ? "bg-destructive/5" : ""}`}>
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{row.time}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{row.timeSlot}</td>
                      <td className="py-3 pr-4 font-semibold">{row.farmer}</td>
                      <td className="py-3 pr-4 flex items-center gap-1.5">
                        {row.equipment}
                        {hasConflict && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="h-4 w-4 text-destructive animate-pulse shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs">{rowConflicts!.join("; ")}</TooltipContent>
                          </Tooltip>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className={`text-xs font-medium ${statusStyles[row.status]}`}>{row.status}</Badge>
                      </td>
                      <td className="py-3">
                        {hasConflict && (
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => openResolve(row.id)}>
                            <ArrowRightLeft className="h-3 w-3" /> Resolve
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">No bookings today. Waiting for SMS...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TooltipProvider>
      )}

      {auditLog.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-muted-foreground">
            <ScrollText className="h-4 w-4" /> Resolution Audit Log
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {auditLog.map((log, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-xs">
                <span className="font-mono text-muted-foreground shrink-0 pt-0.5">
                  {log.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-foreground">{log.farmer}</span>{" — "}
                  {log.action === "reassign" ? (
                    <span>Equipment changed from <span className="font-medium text-destructive line-through">{log.from}</span>{" → "}<span className="font-medium text-primary">{log.to}</span></span>
                  ) : (
                    <span>Time slot shifted from <span className="font-medium text-destructive line-through">{log.from}</span>{" → "}<span className="font-medium text-primary">{log.to}</span></span>
                  )}
                </div>
                <Badge variant="outline" className={`shrink-0 text-[10px] ${log.action === "reassign" ? "border-primary/30 text-primary" : "border-accent-foreground/30 text-accent-foreground"}`}>
                  {log.action === "reassign" ? "Reassigned" : "Adjusted"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Resolve Conflict
            </DialogTitle>
            <DialogDescription>
              {resolveEntry ? `Fix the scheduling conflict for ${resolveEntry.farmer} — ${resolveEntry.equipment}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button variant={resolveMode === "reassign" ? "default" : "outline"} size="sm" className="flex-1 gap-1.5" onClick={() => setResolveMode("reassign")}>
              <ArrowRightLeft className="h-3.5 w-3.5" /> Reassign Equipment
            </Button>
            <Button variant={resolveMode === "adjust" ? "default" : "outline"} size="sm" className="flex-1 gap-1.5" onClick={() => setResolveMode("adjust")}>
              <Clock className="h-3.5 w-3.5" /> Adjust Time Slot
            </Button>
          </div>
          <div className="space-y-4 pt-2">
            {resolveMode === "reassign" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New Equipment</label>
                <Select value={newEquipment} onValueChange={setNewEquipment}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allEquipment.filter((eq) => resolveEntry ? eq !== resolveEntry.equipment : true).map((eq) => (
                      <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Move this booking to a different piece of equipment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Start Time</label>
                  <Select value={newStart} onValueChange={setNewStart}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{timeOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">End Time</label>
                  <Select value={newEnd} onValueChange={setNewEnd}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {timeOptions.filter((t) => parseTime(t) > parseTime(newStart)).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
            <Button onClick={handleResolve} disabled={reassignMutation.isPending}>
              {reassignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply Resolution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
