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
import { BookOpen, Search, Download, CalendarIcon, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { supabase, Transaction } from "@/lib/supabase";

type LogStatus = "Completed" | "Confirmed" | "Ongoing" | "Cancelled";

const statusStyles: Record<LogStatus, string> = {
  Completed:  "bg-primary/10 text-primary border-primary/20",
  Confirmed:  "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Ongoing:    "bg-warning/10 text-warning border-warning/20",
  Cancelled:  "bg-destructive/10 text-destructive border-destructive/20",
};

const PAGE_SIZE = 10;

async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, farmers ( alias, full_name ), equipment ( name, type )")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Transaction[];
}

function exportCSV(rows: Transaction[]) {
  const headers = ["Transaction ID", "Date", "Farmer Alias", "Equipment", "Duration (days)", "Revenue (PHP)", "Status"];
  const csvRows = rows.map((r) => [
    r.id.slice(0, 8).toUpperCase(),
    r.start_date,
    r.farmers?.alias ?? "",
    r.equipment?.name ?? "",
    r.duration_days,
    r.revenue ?? 0,
    r.status,
  ]);
  const csv = [headers, ...csvRows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ebukid-logbook-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const Logbook = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);

  const { data: transactions = [], isLoading, isError, error } = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
    refetchInterval: 15_000,
  });

  const filtered = useMemo(() => {
    return transactions.filter((entry) => {
      const alias = entry.farmers?.alias ?? "";
      const matchesSearch =
        alias.toLowerCase().includes(search.toLowerCase()) ||
        entry.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
      let matchesDate = true;
      if (dateRange?.from) {
        const entryDate = new Date(entry.start_date);
        matchesDate = entryDate >= dateRange.from;
        if (dateRange.to) matchesDate = matchesDate && entryDate <= dateRange.to;
      }
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [transactions, search, statusFilter, dateRange]);

  // Reset to page 1 whenever filters change — must be useEffect, NOT inside useMemo
  useEffect(() => { setPage(1); }, [search, statusFilter, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
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
            <Button
              className="gap-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
              onClick={() => exportCSV(filtered)}
              disabled={filtered.length === 0}
            >
              <Download className="h-4 w-4" />
              Export PhilMech Report (CSV)
            </Button>
          </div>

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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("h-9 justify-start text-left text-sm font-normal min-w-[220px]", !dateRange?.from && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>{format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d, yyyy")}</>
                      ) : format(dateRange.from, "PPP")
                    ) : <span>Date range</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-9 text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border animate-slide-up" style={{ animationDelay: "100ms" }}>
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading transactions...</span>
              </div>
            )}
            {isError && (
              <div className="flex items-center justify-center gap-2 py-16 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">Failed to load: {(error as Error).message}</span>
              </div>
            )}
            {!isLoading && !isError && (
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
                    {paged.map((row) => {
                      const status = row.status as LogStatus;
                      return (
                        <tr key={row.id} className="border-b border-border/50 last:border-0 transition-all duration-150 hover:bg-muted/50 hover:shadow-md cursor-pointer">
                          <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">{row.id.slice(0, 8).toUpperCase()}</td>
                          <td className="py-3.5 px-4 text-muted-foreground">{row.start_date}</td>
                          <td className="py-3.5 px-4 font-semibold">{row.farmers?.alias ?? "—"}</td>
                          <td className="py-3.5 px-4">{row.equipment?.name ?? "—"}</td>
                          <td className="py-3.5 px-4 text-muted-foreground">{row.duration_days} {row.duration_days === 1 ? "day" : "days"}</td>
                          <td className="py-3.5 px-4 text-right font-semibold">
                            {row.revenue != null ? `₱${row.revenue.toLocaleString("en-PH")}` : "—"}
                          </td>
                          <td className="py-3.5 px-5">
                            <Badge variant="outline" className={`text-xs font-medium rounded-full px-3 ${statusStyles[status] ?? ""}`}>
                              {row.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {paged.length === 0 && (
                      <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No entries match your filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {!isLoading && !isError && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="font-medium text-foreground">{filtered.length}</span> entries
                </p>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Logbook;