import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

type Status = "In Field" | "Queued" | "Completed";
type EquipmentType = "all" | "heavy" | "light";

interface ScheduleEntry {
  time: string;
  timeSlot: string;
  farmer: string;
  equipment: string;
  status: Status;
  type: EquipmentType;
}

const schedule: ScheduleEntry[] = [
  { time: "06:00 AM", timeSlot: "06:00 AM – 05:00 PM (Whole Day)", farmer: "JUAN", equipment: "4-Wheel Tractor", status: "In Field", type: "heavy" },
  { time: "08:30 AM", timeSlot: "08:30 AM – 12:00 PM", farmer: "MARIA", equipment: "Water Pump #02", status: "Queued", type: "light" },
  { time: "10:00 AM", timeSlot: "10:00 AM – 02:00 PM", farmer: "PEDRO", equipment: "Hand Tractor", status: "Completed", type: "heavy" },
];

const statusStyles: Record<Status, string> = {
  "In Field": "bg-primary/10 text-primary border-primary/20",
  Queued: "bg-warning/10 text-warning border-warning/20",
  Completed: "bg-muted text-muted-foreground border-border",
};

export function MasterSchedule() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EquipmentType>("all");

  const filtered = useMemo(() => {
    return schedule.filter((row) => {
      const matchesSearch = row.farmer.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || row.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [search, typeFilter]);

  return (
    <div className="stat-card animate-slide-up" style={{ animationDelay: "300ms" }}>
      <h2 className="text-base font-semibold mb-4">Master Schedule — Today</h2>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search farmer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as EquipmentType)}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Equipment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment</SelectItem>
            <SelectItem value="heavy">Heavy</SelectItem>
            <SelectItem value="light">Light</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left font-medium py-2.5 pr-4">Time</th>
              <th className="text-left font-medium py-2.5 pr-4">Time Slot</th>
              <th className="text-left font-medium py-2.5 pr-4">Farmer</th>
              <th className="text-left font-medium py-2.5 pr-4">Equipment</th>
              <th className="text-left font-medium py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border/50 last:border-0 transition-all duration-150 hover:bg-muted/50 hover:shadow-md cursor-pointer"
              >
                <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                  {row.time}
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {row.timeSlot}
                </td>
                <td className="py-3 pr-4 font-semibold">{row.farmer}</td>
                <td className="py-3 pr-4">{row.equipment}</td>
                <td className="py-3">
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${statusStyles[row.status]}`}
                  >
                    {row.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                  No matching schedule entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
