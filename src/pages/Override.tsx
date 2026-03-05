import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  UserPlus,
  Info,
  CalendarIcon,
  AlertTriangle,
  Check,
  ChevronsUpDown,
  Send,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase, Farmer, Equipment } from "@/lib/supabase";

// ── Supabase fetchers ─────────────────────────────────────────────────────────

async function fetchFarmers(): Promise<Farmer[]> {
  const { data, error } = await supabase
    .from("farmers")
    .select("*")
    .order("alias", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Farmer[];
}

async function fetchEquipment(): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from("equipment")
    .select("*")
    .not("status", "eq", "Retired")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Equipment[];
}

// ── Insert walk-in booking ────────────────────────────────────────────────────

interface WalkInPayload {
  farmerId: string;
  farmerAlias: string;
  equipmentId: string;
  equipmentName: string;
  startDate: Date;
  forceOverride: boolean;
}

async function insertWalkIn(payload: WalkInPayload) {
  const startDateStr = format(payload.startDate, "yyyy-MM-dd");
  const status = payload.forceOverride ? "Ongoing" : "Confirmed";
  const smsRaw = `WALK-IN ${payload.equipmentName} ${format(payload.startDate, "MM-dd")} ${payload.farmerAlias}`;

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      farmer_id: payload.farmerId,
      equipment_id: payload.equipmentId,
      start_date: startDateStr,
      duration_days: 1,
      status,
      sms_raw: smsRaw,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Component ─────────────────────────────────────────────────────────────────

const Override = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [selectedFarmerAlias, setSelectedFarmerAlias] = useState("");
  const [farmerOpen, setFarmerOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [selectedEquipmentName, setSelectedEquipmentName] = useState("");
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [forceOverride, setForceOverride] = useState(false);

  // ── Live data from Supabase ─────────────────────────────────────────────────
  const { data: farmers = [], isLoading: farmersLoading } = useQuery({
    queryKey: ["farmers"],
    queryFn: fetchFarmers,
  });

  const { data: equipmentList = [], isLoading: equipmentLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: fetchEquipment,
  });

  // ── Mutation: insert + invalidate all dashboard queries ────────────────────
  const mutation = useMutation({
    mutationFn: insertWalkIn,
    onSuccess: () => {
      // Invalidate every query that displays bookings so they all refetch instantly
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["schedule-today"] });
      queryClient.invalidateQueries({ queryKey: ["sms-feed"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });

      toast({
        title: forceOverride ? "⚡ Emergency Override Injected" : "✅ Walk-In Booked Successfully",
        description: `${selectedFarmerAlias} → ${selectedEquipmentName} on ${format(targetDate!, "PPP")}`,
      });

      // Reset form
      setSelectedFarmerId("");
      setSelectedFarmerAlias("");
      setSelectedEquipmentId("");
      setSelectedEquipmentName("");
      setTargetDate(undefined);
      setForceOverride(false);
    },
    onError: (err: Error) => {
      toast({
        title: "❌ Booking Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const isValid = selectedFarmerId && selectedEquipmentId && targetDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    mutation.mutate({
      farmerId: selectedFarmerId,
      farmerAlias: selectedFarmerAlias,
      equipmentId: selectedEquipmentId,
      equipmentName: selectedEquipmentName,
      startDate: targetDate!,
      forceOverride,
    });
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-auto flex justify-center">
          <div className="w-full max-w-2xl space-y-6">

            {/* Page Header */}
            <div className="animate-slide-up">
              <div className="flex items-center gap-2.5">
                <UserPlus className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Manual Walk-In Entry</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Securely register offline farmer requests into the digital queue
              </p>
            </div>

            {/* Info Alert */}
            <div className="flex items-start gap-3 rounded-xl bg-accent/10 border border-accent/20 px-5 py-4 animate-slide-up" style={{ animationDelay: "50ms" }}>
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80">
                Use this form to securely inject offline requests into the digital queue. All entries are logged in the audit trail.
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 sm:p-8 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Farmer Select — live from Supabase */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Registered Farmer Profile</Label>
                  <Popover open={farmerOpen} onOpenChange={setFarmerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={farmerOpen}
                        className="w-full justify-between h-11 font-normal"
                        disabled={farmersLoading}
                      >
                        {farmersLoading ? (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading farmers...
                          </span>
                        ) : selectedFarmerAlias ? (
                          `${selectedFarmerAlias} — ${farmers.find(f => f.id === selectedFarmerId)?.full_name ?? ""}`
                        ) : (
                          "Search or select farmer..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search farmer name or alias..." />
                        <CommandList>
                          <CommandEmpty>No farmer found.</CommandEmpty>
                          <CommandGroup>
                            {farmers.map((farmer) => (
                              <CommandItem
                                key={farmer.id}
                                value={`${farmer.alias} ${farmer.full_name ?? ""}`}
                                onSelect={() => {
                                  setSelectedFarmerId(farmer.id);
                                  setSelectedFarmerAlias(farmer.alias);
                                  setFarmerOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", selectedFarmerId === farmer.id ? "opacity-100" : "opacity-0")} />
                                {farmer.alias} — {farmer.full_name ?? farmer.phone_number}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Equipment Select — live from Supabase */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Requested Equipment</Label>
                  <Popover open={equipmentOpen} onOpenChange={setEquipmentOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={equipmentOpen}
                        className="w-full justify-between h-11 font-normal"
                        disabled={equipmentLoading}
                      >
                        {equipmentLoading ? (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading equipment...
                          </span>
                        ) : selectedEquipmentName ? (
                          selectedEquipmentName
                        ) : (
                          "Select equipment..."
                        )}
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
                              <CommandItem
                                key={eq.id}
                                value={eq.name}
                                onSelect={() => {
                                  setSelectedEquipmentId(eq.id);
                                  setSelectedEquipmentName(eq.name);
                                  setEquipmentOpen(false);
                                }}
                                disabled={eq.status === "Under Maintenance"}
                              >
                                <Check className={cn("mr-2 h-4 w-4", selectedEquipmentId === eq.id ? "opacity-100" : "opacity-0")} />
                                <span className="flex-1">{eq.name}</span>
                                <span className={cn("text-xs ml-2",
                                  eq.status === "Available" ? "text-primary" :
                                  eq.status === "Under Maintenance" ? "text-destructive" :
                                  "text-warning"
                                )}>
                                  {eq.status}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date Picker */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Target Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full h-11 justify-start text-left font-normal", !targetDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {targetDate ? format(targetDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={targetDate}
                        onSelect={setTargetDate}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Danger Zone */}
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-destructive">Emergency Force Override</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Bypass the queue and assign immediately (sets status to Ongoing)
                        </p>
                      </div>
                    </div>
                    <Switch checked={forceOverride} onCheckedChange={setForceOverride} />
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={!isValid || mutation.isPending}
                  className="w-full h-12 text-sm font-semibold gap-2 transition-all duration-200 hover:shadow-lg hover:translate-y-[-2px]"
                >
                  {mutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Inject into Queue</>
                  )}
                </Button>

              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Override;