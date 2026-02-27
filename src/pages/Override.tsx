import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WalkInEntry {
  farmer: string;
  equipment: string;
  time: string;
}

const Override = () => {
  const { toast } = useToast();
  const [farmer, setFarmer] = useState("");
  const [equipment, setEquipment] = useState("");
  const [recentEntries, setRecentEntries] = useState<WalkInEntry[]>([
    { farmer: "CARLO", equipment: "Hand Tractor", time: "10:32 AM" },
    { farmer: "ELENA", equipment: "Water Pump #01", time: "09:15 AM" },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmer.trim() || !equipment) return;

    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const entry: WalkInEntry = { farmer: farmer.toUpperCase(), equipment, time: now };
    setRecentEntries((prev) => [entry, ...prev]);
    setFarmer("");
    setEquipment("");

    toast({
      title: "Walk-in booked",
      description: `${entry.farmer} → ${entry.equipment} at ${entry.time}`,
    });
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Walk-In Override</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manually book equipment for farmers who visit the cooperative in person
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="stat-card animate-slide-up">
              <h2 className="text-base font-semibold mb-5">New Walk-In Booking</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="farmer">Farmer Name / Alias</Label>
                  <Input
                    id="farmer"
                    placeholder="e.g. JUAN"
                    value={farmer}
                    onChange={(e) => setFarmer(e.target.value)}
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment">Equipment</Label>
                  <Select value={equipment} onValueChange={setEquipment}>
                    <SelectTrigger id="equipment">
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4-Wheel Tractor">4-Wheel Tractor</SelectItem>
                      <SelectItem value="Hand Tractor">Hand Tractor</SelectItem>
                      <SelectItem value="Water Pump #01">Water Pump #01</SelectItem>
                      <SelectItem value="Water Pump #02">Water Pump #02</SelectItem>
                      <SelectItem value="Rice Thresher">Rice Thresher</SelectItem>
                      <SelectItem value="Harvester">Harvester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={!farmer.trim() || !equipment}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Book Equipment
                </Button>
              </form>
            </div>

            {/* Recent walk-ins */}
            <div className="stat-card animate-slide-up" style={{ animationDelay: "100ms" }}>
              <h2 className="text-base font-semibold mb-4">Today's Walk-Ins</h2>
              <div className="space-y-3">
                {recentEntries.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50"
                  >
                    <div>
                      <p className="font-semibold text-sm">{entry.farmer}</p>
                      <p className="text-xs text-muted-foreground">{entry.equipment}</p>
                    </div>
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.time}
                    </Badge>
                  </div>
                ))}
                {recentEntries.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No walk-ins recorded today.
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Override;
