import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase, Equipment } from "@/lib/supabase";
import {
  Package, Wrench, Tractor, Droplets, Wheat, Cog,
  AlertCircle, Loader2, Search, Filter, ArrowUpDown,
  CheckCircle2, Clock, XCircle, ChevronDown, BarChart2,
} from "lucide-react";
import { useState, useMemo } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_HOURS = 100;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getHealthZone(hrs: number): "healthy" | "warning" | "critical" {
  const pct = (hrs / MAX_HOURS) * 100;
  if (pct > 90) return "critical";
  if (pct >= 75) return "warning";
  return "healthy";
}

function getIcon(name: string) {
  const u = name.toUpperCase();
  if (u.includes("WATER PUMP") || u.includes("PUMP")) return Droplets;
  if (u.includes("HARVESTER") || u.includes("THRESHER") || u.includes("WHEAT")) return Wheat;
  if (u.includes("HAND TRACTOR") || u.includes("ROTAVATOR") || u.includes("COG")) return Cog;
  if (u.includes("TRACTOR")) return Tractor;
  return Package;
}

type SortKey = "name" | "hours" | "rentals" | "rate";
type StatusFilter = "All" | "Available" | "In Use / Hiram" | "Under Maintenance";

interface AssetRow extends Equipment { totalRentals: number; }

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchAssets(): Promise<AssetRow[]> {
  const [{ data: equipment, error: e1 }, { data: rentals, error: e2 }] = await Promise.all([
    supabase.from("equipment").select("*").order("name"),
    supabase.from("transactions").select("equipment_id").neq("status", "Cancelled"),
  ]);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);

  const countMap = new Map<string, number>();
  for (const r of rentals ?? []) countMap.set(r.equipment_id, (countMap.get(r.equipment_id) ?? 0) + 1);

  return (equipment ?? []).map((e: Equipment) => ({ ...e, totalRentals: countMap.get(e.id) ?? 0 }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = {
    "Available": { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/8", border: "border-primary/20" },
    "In Use / Hiram": { icon: Clock, color: "text-warning", bg: "bg-warning/8", border: "border-warning/20" },
    "Under Maintenance": { icon: Wrench, color: "text-destructive", bg: "bg-destructive/8", border: "border-destructive/20" },
  }[status] ?? { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" };

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.color} ${config.bg} ${config.border}`}>
      <Icon className="h-2.5 w-2.5" />
      {status}
    </span>
  );
}

function HealthBar({ hours }: { hours: number }) {
  const zone = getHealthZone(hours);
  const pct = Math.min(Math.round((hours / MAX_HOURS) * 100), 100);
  const colors = {
    healthy: { bar: "[&>div]:bg-primary", text: "text-primary" },
    warning: { bar: "[&>div]:bg-warning", text: "text-warning" },
    critical: { bar: "[&>div]:bg-destructive", text: "text-destructive" },
  }[zone];

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground font-medium">Operating Hours</span>
        <span className={`font-bold flex items-center gap-1 ${colors.text}`}>
          {zone === "critical" && <AlertCircle className="h-3 w-3 animate-pulse" />}
          {hours}/{MAX_HOURS} hrs
        </span>
      </div>
      <Progress value={pct} className={`h-2 rounded-full ${colors.bar}`} />
    </div>
  );
}

function AssetCard({ asset, index }: { asset: AssetRow; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getIcon(asset.name);
  const zone = getHealthZone(asset.operating_hours);

  return (
    <div
      className="stat-card animate-slide-up flex flex-col gap-3"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "hsl(158 64% 28% / 0.08)", border: "1px solid hsl(158 64% 28% / 0.15)" }}
        >
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight truncate">{asset.name}</h3>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{asset.type}</p>
        </div>
        <StatusBadge status={asset.status} />
      </div>

      {/* Health bar */}
      <HealthBar hours={asset.operating_hours} />

      {/* Key stats row */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Daily Rate", value: `₱${asset.daily_rate.toLocaleString("en-PH")}` },
          { label: "Total Rentals", value: `${asset.totalRentals} bookings` },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg px-3 py-2"
            style={{ background: "hsl(210 20% 97%)", border: "1px solid hsl(var(--border))" }}
          >
            <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        <span>{expanded ? "Hide details" : "Show details"}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div
          className="rounded-lg p-3 text-xs space-y-2"
          style={{ background: "hsl(210 20% 97%)", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex justify-between">
            <span className="text-muted-foreground">Equipment ID</span>
            <span className="font-mono font-medium">{asset.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Health Status</span>
            <span className={`font-semibold capitalize ${
              zone === "critical" ? "text-destructive" : zone === "warning" ? "text-warning" : "text-primary"
            }`}>{zone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hrs until service</span>
            <span className="font-semibold">{Math.max(0, MAX_HOURS - asset.operating_hours)} hrs remaining</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <Button variant="outline" size="sm" className="flex-1 text-xs h-8">
          View Logs
        </Button>
        {zone === "critical" || asset.status === "Under Maintenance" ? (
          <Button size="sm" className="flex-1 text-xs h-8 bg-destructive text-white hover:bg-destructive/90">
            <Wrench className="h-3 w-3 mr-1" /> Maintain
          </Button>
        ) : (
          <Button size="sm" className="flex-1 text-xs h-8">
            <BarChart2 className="h-3 w-3 mr-1" /> Analytics
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const Assets = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: assets = [], isLoading, isError, error } = useQuery({
    queryKey: ["assets"],
    queryFn: fetchAssets,
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    let list = [...assets];
    if (search) list = list.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "All") list = list.filter((a) => a.status === statusFilter);
    list.sort((a, b) => {
      const val = {
        name: () => a.name.localeCompare(b.name),
        hours: () => a.operating_hours - b.operating_hours,
        rentals: () => a.totalRentals - b.totalRentals,
        rate: () => a.daily_rate - b.daily_rate,
      }[sortKey]();
      return sortAsc ? val : -val;
    });
    return list;
  }, [assets, search, statusFilter, sortKey, sortAsc]);

  const stats = useMemo(() => ({
    total: assets.length,
    healthy: assets.filter((a) => getHealthZone(a.operating_hours) === "healthy").length,
    warning: assets.filter((a) => getHealthZone(a.operating_hours) === "warning").length,
    critical: assets.filter((a) => getHealthZone(a.operating_hours) === "critical").length,
    available: assets.filter((a) => a.status === "Available").length,
    inUse: assets.filter((a) => a.status === "In Use / Hiram").length,
    maintenance: assets.filter((a) => a.status === "Under Maintenance").length,
  }), [assets]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main
          className="relative flex-1 p-6 space-y-6 overflow-auto"
          style={{
            background: "linear-gradient(135deg, hsl(158 40% 96%) 0%, hsl(210 25% 97%) 35%, hsl(180 30% 96%) 65%, hsl(158 35% 95%) 100%)",
            backgroundAttachment: "fixed",
          }}
        >
          {/* Page title */}
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "hsl(158 64% 28% / 0.1)", border: "1px solid hsl(158 64% 28% / 0.2)" }}
                >
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Asset Tracker</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Monitor equipment health, operating hours, and maintenance readiness</p>
            </div>
          </div>

          {/* Summary strip */}
          {!isLoading && !isError && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: "Total", value: stats.total, color: "text-foreground" },
                { label: "Available", value: stats.available, color: "text-primary" },
                { label: "In Use", value: stats.inUse, color: "text-warning" },
                { label: "Maintenance", value: stats.maintenance, color: "text-destructive" },
                { label: "Healthy", value: stats.healthy, color: "text-primary" },
                { label: "Warning", value: stats.warning, color: "text-warning" },
                { label: "Critical", value: stats.critical, color: "text-destructive" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-card rounded-xl px-4 py-3 text-center border border-border/60 hover:border-primary/20 transition-colors"
                  style={{ boxShadow: "0 1px 4px hsl(215 30% 10% / 0.05)" }}
                >
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                  <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filters & controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search equipment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-card border border-border focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-card border border-border/60">
              <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1.5" />
              {(["All", "Available", "In Use / Hiram", "Under Maintenance"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all duration-150 whitespace-nowrap ${
                    statusFilter === s
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "In Use / Hiram" ? "In Use" : s}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-card border border-border/60">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground ml-1.5" />
              {([["name", "Name"], ["hours", "Hours"], ["rentals", "Rentals"], ["rate", "Rate"]] as [SortKey, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all duration-150 ${
                    sortKey === key
                      ? "bg-background text-foreground shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label} {sortKey === key ? (sortAsc ? "↑" : "↓") : ""}
                </button>
              ))}
            </div>

            {/* Results count */}
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} of {assets.length} assets
            </span>
          </div>

          {/* Loading / Error */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading assets...</span>
            </div>
          )}
          {isError && (
            <div className="flex items-center justify-center gap-2 py-16 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{(error as Error).message}</span>
            </div>
          )}

          {/* Grid */}
          {!isLoading && !isError && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((asset, i) => (
                <AssetCard key={asset.id} asset={asset} index={i} />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-3 py-16 text-center">
                  <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No assets match your filters.</p>
                  <button onClick={() => { setSearch(""); setStatusFilter("All"); }} className="text-xs text-primary hover:underline mt-1">
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Assets;