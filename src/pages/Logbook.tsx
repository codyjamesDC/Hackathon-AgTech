import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Search } from "lucide-react";
import { useState } from "react";

type LogStatus = "Returned" | "In Use" | "Overdue";

interface LogEntry {
  date: string;
  farmer: string;
  equipment: string;
  duration: string;
  status: LogStatus;
  smsCode: string;
}

const logData: LogEntry[] = [
  { date: "2026-02-27", farmer: "JUAN", equipment: "4-Wheel Tractor", duration: "4 hrs", status: "In Use", smsCode: "HIRAM TRACTOR" },
  { date: "2026-02-27", farmer: "MARIA", equipment: "Water Pump #02", duration: "2 hrs", status: "In Use", smsCode: "HIRAM PUMP" },
  { date: "2026-02-26", farmer: "PEDRO", equipment: "Hand Tractor", duration: "6 hrs", status: "Returned", smsCode: "END TRACTOR" },
  { date: "2026-02-26", farmer: "ANA", equipment: "Rice Thresher", duration: "3 hrs", status: "Returned", smsCode: "END THRESHER" },
  { date: "2026-02-25", farmer: "JOSE", equipment: "4-Wheel Tractor", duration: "8 hrs", status: "Overdue", smsCode: "HIRAM TRACTOR" },
  { date: "2026-02-25", farmer: "ROSA", equipment: "Water Pump #01", duration: "5 hrs", status: "Returned", smsCode: "END PUMP" },
  { date: "2026-02-24", farmer: "DIEGO", equipment: "Harvester", duration: "7 hrs", status: "Returned", smsCode: "END HARVESTER" },
  { date: "2026-02-24", farmer: "LITA", equipment: "Hand Tractor", duration: "4 hrs", status: "Returned", smsCode: "END TRACTOR" },
];

const statusStyles: Record<LogStatus, string> = {
  Returned: "bg-muted text-muted-foreground border-border",
  "In Use": "bg-primary/10 text-primary border-primary/20",
  Overdue: "bg-destructive/10 text-destructive border-destructive/20",
};

const Logbook = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = logData.filter((entry) => {
    const matchesSearch =
      entry.farmer.toLowerCase().includes(search.toLowerCase()) ||
      entry.equipment.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Digital Logbook</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Complete history of all equipment rentals and returns
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search farmer or equipment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Returned">Returned</SelectItem>
                <SelectItem value="In Use">In Use</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="stat-card animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left font-medium py-2.5 pr-4">Date</th>
                    <th className="text-left font-medium py-2.5 pr-4">Farmer</th>
                    <th className="text-left font-medium py-2.5 pr-4">Equipment</th>
                    <th className="text-left font-medium py-2.5 pr-4">Duration</th>
                    <th className="text-left font-medium py-2.5 pr-4">SMS Code</th>
                    <th className="text-left font-medium py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{row.date}</td>
                      <td className="py-3 pr-4 font-semibold">{row.farmer}</td>
                      <td className="py-3 pr-4">{row.equipment}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.duration}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{row.smsCode}</td>
                      <td className="py-3">
                        <Badge variant="outline" className={`text-xs font-medium ${statusStyles[row.status]}`}>
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No entries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Logbook;
