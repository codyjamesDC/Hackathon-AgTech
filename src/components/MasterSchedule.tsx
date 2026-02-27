import { Badge } from "@/components/ui/badge";

type Status = "In Field" | "Queued" | "Completed";

interface ScheduleEntry {
  time: string;
  farmer: string;
  equipment: string;
  status: Status;
}

const schedule: ScheduleEntry[] = [
  { time: "06:00 AM", farmer: "JUAN", equipment: "4-Wheel Tractor", status: "In Field" },
  { time: "08:30 AM", farmer: "MARIA", equipment: "Water Pump #02", status: "Queued" },
  { time: "10:00 AM", farmer: "PEDRO", equipment: "Hand Tractor", status: "Completed" },
];

const statusStyles: Record<Status, string> = {
  "In Field": "bg-primary/10 text-primary border-primary/20",
  Queued: "bg-warning/10 text-warning border-warning/20",
  Completed: "bg-muted text-muted-foreground border-border",
};

export function MasterSchedule() {
  return (
    <div className="stat-card animate-slide-up" style={{ animationDelay: "300ms" }}>
      <h2 className="text-base font-semibold mb-4">Master Schedule — Today</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left font-medium py-2.5 pr-4">Time</th>
              <th className="text-left font-medium py-2.5 pr-4">Farmer</th>
              <th className="text-left font-medium py-2.5 pr-4">Equipment</th>
              <th className="text-left font-medium py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                  {row.time}
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
