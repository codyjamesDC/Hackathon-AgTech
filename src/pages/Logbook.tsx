import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { BookOpen, Search, Download, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

type LogStatus = "Completed" | "Booked" | "In Use" | "Cancelled";

interface LogEntry {
  txId: string;
  date: string;
  farmer: string;
  equipment: string;
  duration: string;
  revenue: string;
  status: LogStatus;
}

const logData: LogEntry[] = [
  { txId: "TXN-2026-0282", date: "2026-03-09", farmer: "JUAN", equipment: "Tractor", duration: "11 hrs", revenue: "₱1,100", status: "Booked" },
  { txId: "TXN-2026-0281", date: "2026-02-28", farmer: "JUAN", equipment: "4-Wheel Tractor", duration: "4 hrs", revenue: "₱400", status: "Completed" },
  { txId: "TXN-2026-0280", date: "2026-02-28", farmer: "MARIA", equipment: "Water Pump #02", duration: "2 hrs", revenue: "₱100", status: "Booked" },
  { txId: "TXN-2026-0279", date: "2026-02-27", farmer: "PEDRO", equipment: "Hand Tractor", duration: "6 hrs", revenue: "₱450", status: "Completed" },
  { txId: "TXN-2026-0278", date: "2026-02-27", farmer: "ANA", equipment: "Rice Thresher", duration: "3 hrs", revenue: "₱225", status: "Completed" },
  { txId: "TXN-2026-0277", date: "2026-02-26", farmer: "JOSE", equipment: "4-Wheel Tractor", duration: "8 hrs", revenue: "₱800", status: "Cancelled" },
  { txId: "TXN-2026-0276", date: "2026-02-26", farmer: "ROSA", equipment: "Water Pump #01", duration: "5 hrs", revenue: "₱250", status: "Completed" },
  { txId: "TXN-2026-0275", date: "2026-02-25", farmer: "DIEGO", equipment: "Harvester", duration: "7 hrs", revenue: "₱1,050", status: "Completed" },
  { txId: "TXN-2026-0274", date: "2026-02-25", farmer: "LITA", equipment: "Hand Tractor", duration: "4 hrs", revenue: "₱300", status: "Completed" },
  { txId: "TXN-2026-0273", date: "2026-02-24", farmer: "CARLOS", equipment: "4-Wheel Tractor", duration: "5 hrs", revenue: "₱500", status: "Completed" },
  { txId: "TXN-2026-0272", date: "2026-02-24", farmer: "ELENA", equipment: "Water Pump #03", duration: "3 hrs", revenue: "₱150", status: "Completed" },
  { txId: "TXN-2026-0271", date: "2026-02-23", farmer: "RAMON", equipment: "Rice Thresher", duration: "6 hrs", revenue: "₱375", status: "Completed" },
  { txId: "TXN-2026-0270", date: "2026-02-23", farmer: "CONSUELO", equipment: "Harvester", duration: "8 hrs", revenue: "₱1,200", status: "Cancelled" },
  { txId: "TXN-2026-0269", date: "2026-02-22", farmer: "BERTO", equipment: "Hand Tractor", duration: "3 hrs", revenue: "₱225", status: "Completed" },
  { txId: "TXN-2026-0268", date: "2026-02-22", farmer: "NENA", equipment: "4-Wheel Tractor", duration: "7 hrs", revenue: "₱700", status: "Completed" },
  { txId: "TXN-2026-0267", date: "2026-02-21", farmer: "TONYO", equipment: "Water Pump #02", duration: "4 hrs", revenue: "₱200", status: "Completed" },
];

const statusStyles: Record<LogStatus, string> = {
  Completed: "bg-primary/10 text-primary border-primary/20",
  Booked: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "In Use": "bg-warning/10 text-warning border-warning/20",
  Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const PAGE_SIZE = 10;

const Logbook = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return logData.filter((entry) => {
      const matchesSearch =
        entry.farmer.toLowerCase().includes(search.toLowerCase()) ||
        entry.txId.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
      let matchesDate = true;
      if (dateRange?.from) {
        const entryDate = new Date(entry.date);
        matchesDate = entryDate >= dateRange.from;
        if (dateRange.to) {
          matchesDate = matchesDate && entryDate <= dateRange.to;
        }
      }
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [search, statusFilter, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filters change
  useMemo(() => setPage(1), [search, statusFilter, dateRange]);

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Header */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <BookOpen className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Digital Logbook & Audit Trail</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Complete transaction history for compliance and PhilMech reporting
              </p>
            </div>
            <Button className="gap-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
              <Download className="h-4 w-4" />
              Export PhilMech Report (CSV)
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="stat-card animate-slide-up !p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by TX ID or farmer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 justify-start text-left text-sm font-normal min-w-[220px]",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "PPP")
                      )
                    ) : (
                      <span>Date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-9 text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Booked">Booked</SelectItem>
                  <SelectItem value="In Use">In Use</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-card rounded-xl shadow-sm border border-border animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground py-3 px-5">Transaction ID</th>
                    <th className="text-left font-medium text-muted-foreground py-3 px-4">Date</th>
                    <th className="text-left font-medium text-muted-foreground py-3 px-4">Farmer Alias</th>
                    <th className="text-left font-medium text-muted-foreground py-3 px-4">Equipment</th>
                    <th className="text-left font-medium text-muted-foreground py-3 px-4">Duration</th>
                    <th className="text-right font-medium text-muted-foreground py-3 px-4">Revenue</th>
                    <th className="text-left font-medium text-muted-foreground py-3 px-5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row, i) => (
                    <tr
                      key={row.txId}
                      className="border-b border-border/50 last:border-0 transition-all duration-150 hover:bg-muted/50 hover:shadow-md cursor-pointer"
                    >
                      <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">{row.txId}</td>
                      <td className="py-3.5 px-4 text-muted-foreground">{row.date}</td>
                      <td className="py-3.5 px-4 font-semibold">{row.farmer}</td>
                      <td className="py-3.5 px-4">{row.equipment}</td>
                      <td className="py-3.5 px-4 text-muted-foreground">{row.duration}</td>
                      <td className="py-3.5 px-4 text-right font-semibold">{row.revenue}</td>
                      <td className="py-3.5 px-5">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium rounded-full px-3 ${statusStyles[row.status]}`}
                        >
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        No entries match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of <span className="font-medium text-foreground">{filtered.length}</span> entries
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Logbook;
