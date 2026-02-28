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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const farmers = [
  { label: "JUAN — ID:001", value: "JUAN" },
  { label: "MARIA — ID:002", value: "MARIA" },
  { label: "PEDRO — ID:003", value: "PEDRO" },
  { label: "ANA — ID:004", value: "ANA" },
  { label: "JOSE — ID:005", value: "JOSE" },
  { label: "ROSA — ID:006", value: "ROSA" },
  { label: "DIEGO — ID:007", value: "DIEGO" },
  { label: "LITA — ID:008", value: "LITA" },
  { label: "CARLOS — ID:009", value: "CARLOS" },
  { label: "ELENA — ID:010", value: "ELENA" },
];

const equipmentOptions = [
  "4-Wheel Tractor",
  "Hand Tractor",
  "Water Pump #01",
  "Water Pump #02",
  "Rice Thresher",
  "Harvester",
  "Combine Harvester A",
];

const Override = () => {
  const { toast } = useToast();
  const [selectedFarmer, setSelectedFarmer] = useState("");
  const [farmerOpen, setFarmerOpen] = useState(false);
  const [equipment, setEquipment] = useState("");
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [forceOverride, setForceOverride] = useState(false);

  const isValid = selectedFarmer && equipment && targetDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    toast({
      title: forceOverride ? "⚡ Emergency Override Injected" : "✅ Queued Successfully",
      description: `${selectedFarmer} → ${equipment} on ${format(targetDate!, "PPP")}`,
    });

    setSelectedFarmer("");
    setEquipment("");
    setTargetDate(undefined);
    setForceOverride(false);
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
                {/* Farmer Select (Searchable) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Registered Farmer Profile</Label>
                  <Popover open={farmerOpen} onOpenChange={setFarmerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={farmerOpen}
                        className="w-full justify-between h-11 font-normal"
                      >
                        {selectedFarmer
                          ? farmers.find((f) => f.value === selectedFarmer)?.label
                          : "Search or select farmer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search farmer name or ID..." />
                        <CommandList>
                          <CommandEmpty>No farmer found.</CommandEmpty>
                          <CommandGroup>
                            {farmers.map((farmer) => (
                              <CommandItem
                                key={farmer.value}
                                value={farmer.label}
                                onSelect={() => {
                                  setSelectedFarmer(farmer.value);
                                  setFarmerOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedFarmer === farmer.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {farmer.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Equipment Select */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Requested Equipment</Label>
                  <Select value={equipment} onValueChange={setEquipment}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select equipment..." />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentOptions.map((eq) => (
                        <SelectItem key={eq} value={eq}>
                          {eq}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Picker */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Target Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-11 justify-start text-left font-normal",
                          !targetDate && "text-muted-foreground"
                        )}
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
                        <p className="text-sm font-semibold text-destructive">
                          Emergency Force Override
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Bypass the queue and assign immediately
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={forceOverride}
                      onCheckedChange={setForceOverride}
                    />
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={!isValid}
                  className="w-full h-12 text-sm font-semibold gap-2 transition-all duration-200 hover:shadow-lg hover:translate-y-[-2px]"
                >
                  <Send className="h-4 w-4" />
                  Inject into SMS Queue
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
