import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from "@/components/ui/command";
import {
  UserPlus, CalendarIcon, AlertTriangle, Check,
  ChevronsUpDown, Send, Loader2, ClipboardList,
  Tractor, User, Zap,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase, Farmer, Equipment } from "@/lib/supabase";

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchFarmers(): Promise<Farmer[]> {
  const { data, error } = await supabase.from("farmers").select("*").order("alias");
  if (error) throw new Error(error.message);
  return data as Farmer[];
}

async function fetchEquipment(): Promise<Equipment[]> {
  const { data, error } = await supabase.from("equipment").select("*").not("status", "eq", "Retired").order("name");
  if (error) throw new Error(error.message);
  return data as Equipment[];
}

// ── Mutation ──────────────────────────────────────────────────────────────────

interface WalkInPayload {
  farmerId: string; farmerAlias: string;
  equipmentId: string; equipmentName: string;
  startDate: Date; forceOverride: boolean;
}

async function insertWalkIn(payload: WalkInPayload) {
  const { data, error } = await supabase.from("transactions").insert({
    farmer_id: payload.farmerId,
    equipment_id: payload.equipmentId,
    start_date: format(payload.startDate, "yyyy-MM-dd"),
    duration_days: 1,
    status: payload.forceOverride ? "Ongoing" : "Confirmed",
    sms_raw: `WALK-IN ${payload.equipmentName} ${format(payload.startDate, "MM-dd")} ${payload.farmerAlias}`,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step, current }: { step: number; current: number }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
      done ? "bg-primary text-white" :
      active ? "bg-primary/15 text-primary border-2 border-primary" :
      "bg-muted text-muted-foreground border border-border"
    }`}>
      {done ? <Check className="h-3.5 w-3.5" /> : step}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const Override = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [selectedFarmerAlias, setSelectedFarmerAlias] = useState("");
  const [selectedFarmerName, setSelectedFarmerName] = useState("");
  const [farmerOpen, setFarmerOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [selectedEquipmentName, setSelectedEquipmentName] = useState("");
  const [selectedEquipmentStatus, setSelectedEquipmentStatus] = useState("");
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [forceOverride, setForceOverride] = useState(false);

  const { data: farmers = [], isLoading: farmersLoading } = useQuery({ queryKey: ["farmers"], queryFn: fetchFarmers });
  const { data: equipmentList = [], isLoading: equipmentLoading } = useQuery({ queryKey: ["equipment"], queryFn: fetchEquipment });

  const mutation = useMutation({
    mutationFn: insertWalkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["schedule-today"] });
      queryClient.invalidateQueries({ queryKey: ["sms-feed"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      toast({
        title: forceOverride ? "⚡ Emergency Override Injected" : "✅ Walk-In Booked Successfully",
        description: `${selectedFarmerAlias} → ${selectedEquipmentName} on ${format(targetDate!, "PPP")}`,
      });
      setSelectedFarmerId(""); setSelectedFarmerAlias(""); setSelectedFarmerName("");
      setSelectedEquipmentId(""); setSelectedEquipmentName(""); setSelectedEquipmentStatus("");
      setTargetDate(undefined); setForceOverride(false);
    },
    onError: (err: Error) => {
      toast({ title: "❌ Booking Failed", description: err.message, variant: "destructive" });
    },
  });

  // Compute current step for progress
  const currentStep = !selectedFarmerId ? 1 : !selectedEquipmentId ? 2 : !targetDate ? 3 : 4;
  const isValid = selectedFarmerId && selectedEquipmentId && targetDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    mutation.mutate({
      farmerId: selectedFarmerId, farmerAlias: selectedFarmerAlias,
      equipmentId: selectedEquipmentId, equipmentName: selectedEquipmentName,
      startDate: targetDate!, forceOverride,
    });
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main
          className="relative flex-1 overflow-auto"
          style={{
            background: "linear-gradient(135deg, hsl(158 40% 96%) 0%, hsl(210 25% 97%) 35%, hsl(180 30% 96%) 65%, hsl(158 35% 95%) 100%)",
            backgroundAttachment: "fixed",
          }}
        >
          {/* Background blooms */}
          <div className="absolute top-0 left-0 w-96 h-96 pointer-events-none" style={{ background: "radial-gradient(ellipse at 0% 0%, hsl(158 64% 28% / 0.06) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 pointer-events-none" style={{ background: "radial-gradient(ellipse at 100% 100%, hsl(180 55% 30% / 0.05) 0%, transparent 70%)" }} />

          <div className="relative max-w-6xl mx-auto px-8 py-10">

            {/* ── Page Header ── */}
            <div className="mb-10 animate-slide-up">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(158 64% 28% / 0.1)", border: "1px solid hsl(158 64% 28% / 0.2)" }}>
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Walk-In Override</h1>
                  <p className="text-sm text-muted-foreground">Register offline farmer requests into the digital queue</p>
                </div>
              </div>
            </div>

            {/* ── Two-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

              {/* ── LEFT: Form (3 cols) ── */}
              <div className="lg:col-span-3 space-y-5 animate-slide-up" style={{ animationDelay: "50ms" }}>

                {/* Step progress */}
                <div className="bg-card rounded-xl px-6 py-4 border border-border/60 flex items-center gap-3" style={{ boxShadow: "0 1px 4px hsl(215 30% 10% / 0.05)" }}>
                  {[1, 2, 3, 4].map((step, i) => (
                    <div key={step} className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <StepIndicator step={step} current={currentStep} />
                        {!([1,2,3,4].indexOf(step) === 3) && <span className="text-xs text-muted-foreground hidden sm:inline">{["Farmer","Equipment","Date","Review"][i]}</span>}
                        {step === 4 && <span className="text-xs text-muted-foreground hidden sm:inline">Review</span>}
                      </div>
                      {step < 4 && <div className={`flex-1 h-px transition-all duration-300 ${currentStep > step ? "bg-primary/40" : "bg-border"}`} />}
                    </div>
                  ))}
                </div>

                {/* Farmer */}
                <div className="bg-card rounded-xl p-6 border border-border/60 space-y-3" style={{ boxShadow: "0 1px 4px hsl(215 30% 10% / 0.05)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "hsl(158 64% 28% / 0.1)", color: "hsl(158 64% 28%)" }}>1</div>
                    <Label className="text-sm font-semibold">Registered Farmer</Label>
                  </div>
                  <Popover open={farmerOpen} onOpenChange={setFarmerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-11 font-normal" disabled={farmersLoading}>
                        {farmersLoading ? (
                          <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</span>
                        ) : selectedFarmerAlias ? (
                          <span className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{selectedFarmerAlias[0]}</div>
                            {selectedFarmerAlias} — {selectedFarmerName}
                          </span>
                        ) : "Search or select farmer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search by name or alias..." />
                        <CommandList>
                          <CommandEmpty>No farmer found.</CommandEmpty>
                          <CommandGroup>
                            {farmers.map((f) => (
                              <CommandItem key={f.id} value={`${f.alias} ${f.full_name ?? ""}`} onSelect={() => { setSelectedFarmerId(f.id); setSelectedFarmerAlias(f.alias); setSelectedFarmerName(f.full_name ?? f.phone_number ?? ""); setFarmerOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", selectedFarmerId === f.id ? "opacity-100" : "opacity-0")} />
                                <div>
                                  <p className="text-sm font-medium">{f.alias}</p>
                                  <p className="text-xs text-muted-foreground">{f.full_name ?? f.phone_number}</p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Equipment */}
                <div className="bg-card rounded-xl p-6 border border-border/60 space-y-3" style={{ boxShadow: "0 1px 4px hsl(215 30% 10% / 0.05)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "hsl(158 64% 28% / 0.1)", color: "hsl(158 64% 28%)" }}>2</div>
                    <Label className="text-sm font-semibold">Requested Equipment</Label>
                  </div>
                  <Popover open={equipmentOpen} onOpenChange={setEquipmentOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-11 font-normal" disabled={equipmentLoading}>
                        {equipmentLoading ? (
                          <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</span>
                        ) : selectedEquipmentName ? (
                          <span className="flex items-center gap-2">
                            <Tractor className="h-4 w-4 text-primary" />
                            {selectedEquipmentName}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${selectedEquipmentStatus === "Available" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>{selectedEquipmentStatus}</span>
                          </span>
                        ) : "Select equipment..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search equipment..." />
                        <CommandList>
                          <CommandEmpty>No equipment found.</CommandEmpty>
                          <CommandGroup>
                            {equipmentList.map((eq) => (
                              <CommandItem key={eq.id} value={eq.name} disabled={eq.status === "Under Maintenance"} onSelect={() => { setSelectedEquipmentId(eq.id); setSelectedEquipmentName(eq.name); setSelectedEquipmentStatus(eq.status); setEquipmentOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", selectedEquipmentId === eq.id ? "opacity-100" : "opacity-0")} />
                                <span className="flex-1 text-sm">{eq.name}</span>
                                <span className={cn("text-xs ml-2", eq.status === "Available" ? "text-primary" : eq.status === "Under Maintenance" ? "text-destructive" : "text-warning")}>{eq.status}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date */}
                <div className="bg-card rounded-xl p-6 border border-border/60" style={{ boxShadow: "0 1px 4px hsl(215 30% 10% / 0.05)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "hsl(158 64% 28% / 0.1)", color: "hsl(158 64% 28%)" }}>3</div>
                    <Label className="text-sm font-semibold">Target Date</Label>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full h-11 justify-start font-normal", !targetDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {targetDate ? format(targetDate, "PPP") : "Pick a booking date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={targetDate} onSelect={setTargetDate} disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Override toggle */}
                <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Zap className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-destructive">Emergency Force Override</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Bypass queue — sets status to <span className="font-mono font-semibold">Ongoing</span> immediately</p>
                      </div>
                    </div>
                    <Switch checked={forceOverride} onCheckedChange={setForceOverride} />
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Summary + Submit (2 cols) ── */}
              <div className="lg:col-span-2 space-y-5 animate-slide-up" style={{ animationDelay: "100ms" }}>

                {/* Booking summary card */}
                <div className="bg-card rounded-xl p-6 border border-border/60 sticky top-6" style={{ boxShadow: "0 1px 4px hsl(215 30% 10% / 0.05)" }}>
                  <div className="flex items-center gap-2 mb-5">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Booking Summary</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Farmer */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: selectedFarmerId ? "hsl(158 64% 28% / 0.1)" : "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                        <User className={`h-4 w-4 ${selectedFarmerId ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Farmer</p>
                        {selectedFarmerId ? (
                          <>
                            <p className="text-sm font-semibold text-foreground">{selectedFarmerAlias}</p>
                            <p className="text-xs text-muted-foreground truncate">{selectedFarmerName}</p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Not selected</p>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Equipment */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: selectedEquipmentId ? "hsl(158 64% 28% / 0.1)" : "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                        <Tractor className={`h-4 w-4 ${selectedEquipmentId ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Equipment</p>
                        {selectedEquipmentId ? (
                          <>
                            <p className="text-sm font-semibold text-foreground">{selectedEquipmentName}</p>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${selectedEquipmentStatus === "Available" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>{selectedEquipmentStatus}</span>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Not selected</p>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Date */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: targetDate ? "hsl(158 64% 28% / 0.1)" : "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                        <CalendarIcon className={`h-4 w-4 ${targetDate ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Date</p>
                        {targetDate ? (
                          <p className="text-sm font-semibold text-foreground">{format(targetDate, "PPP")}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Not selected</p>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Status</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${forceOverride ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-primary/10 text-primary border-primary/20"}`}>
                        {forceOverride ? "⚡ Ongoing" : "✅ Confirmed"}
                      </span>
                    </div>
                  </div>

                  {/* Submit button */}
                  <form onSubmit={handleSubmit}>
                    <Button
                      type="submit"
                      disabled={!isValid || mutation.isPending}
                      className={`w-full h-12 mt-6 text-sm font-semibold gap-2 transition-all duration-200 ${isValid ? "hover:shadow-lg hover:-translate-y-0.5" : ""} ${forceOverride ? "bg-destructive hover:bg-destructive/90" : ""}`}
                    >
                      {mutation.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                      ) : forceOverride ? (
                        <><Zap className="h-4 w-4" /> Force Override</>
                      ) : (
                        <><Send className="h-4 w-4" /> Inject into Queue</>
                      )}
                    </Button>
                  </form>

                  {!isValid && (
                    <p className="text-[11px] text-muted-foreground text-center mt-3">
                      Complete all fields to submit
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Override;