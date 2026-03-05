import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase, Equipment } from "@/lib/supabase";
import {
  Package,
  Wrench,
  Tractor,
  Droplets,
  Wheat,
  Cog,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_HOURS_BEFORE_SERVICE = 100;

function getHealthZone(hrs: number) {
  const pct = (hrs / MAX_HOURS_BEFORE_SERVICE) * 100;
  if (pct > 90) return "critical";
  if (pct >= 75) return "warning";
  return "healthy";
}

const barColors = {
  healthy: "[&>div]:bg-primary",
  warning: "[&>div]:bg-warning",
  critical: "[&>div]:bg-destructive",
};

function getIcon(name: string) {
  const upper = name.toUpperCase();
  if (upper.includes("WATER PUMP") || upper.includes("PUMP")) return Droplets;
  if (upper.includes("HARVESTER") || upper.includes("THRESHER") || upper.includes("WHEAT")) return Wheat;
  if (upper.includes("HAND TRACTOR") || upper.includes("ROTAVATOR") || upper.includes("COG")) return Cog;
  if (upper.includes("TRACTOR")) return Tractor;
  return Package;
}

// ── Supabase fetch ────────────────────────────────────────────────────────────

interface AssetRow extends Equipment {
  totalRentals: number;
}

async function fetchAssets(): Promise<AssetRow[]> {
  // Fetch all equipment
  const { data: equipment, error: equipError } = await supabase
    .from("equipment")
    .select("*")
    .order("name", { ascending: true });

  if (equipError) throw new Error(equipError.message);

  // Fetch rental counts per equipment
  const { data: rentalCounts, error: rentalError } = await supabase
    .from("transactions")
    .select("equipment_id")
    .neq("status", "Cancelled");

  if (rentalError) throw new Error(rentalError.message);

  const countMap = new Map<string, number>();
  for (const row of rentalCounts ?? []) {
    countMap.set(row.equipment_id, (countMap.get(row.equipment_id) ?? 0) + 1);
  }

  return (equipment ?? []).map((e: Equipment) => ({
    ...e,
    totalRentals: countMap.get(e.id) ?? 0,
  }));
}

// ── Component ─────────────────────────────────────────────────────────────────

const Assets = () => {
  const { data: assets = [], isLoading, isError, error } = useQuery({
    queryKey: ["assets"],
    queryFn: fetchAssets,
    refetchInterval: 30_000,
  });

  const healthyCount = assets.filter((a) => getHealthZone(a.operating_hours) === "healthy").length;
  const needsAttentionCount = assets.filter((a) => getHealthZone(a.operating_hours) !== "healthy").length;

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Header */}
          <div>
            <div className="flex items-center gap-2.5">
              <Package className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Asset Tracker & Maintenance</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor equipment health, operating hours, and maintenance readiness
            </p>
          </div>

          {/* Loading / Error states */}
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

          {!isLoading && !isError && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Total Assets", value: assets.length, color: "text-foreground" },
                  { label: "Healthy", value: healthyCount, color: "text-primary" },
                  { label: "Needs Attention", value: needsAttentionCount, color: "text-destructive" },
                ].map((s) => (
                  <div key={s.label} className="stat-card animate-slide-up text-center">
                    <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Equipment Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {assets.map((asset, i) => {
                  const zone = getHealthZone(asset.operating_hours);
                  const pct = Math.min(
                    Math.round((asset.operating_hours / MAX_HOURS_BEFORE_SERVICE) * 100),
                    100
                  );
                  const Icon = getIcon(asset.name);

                  return (
                    <div
                      key={asset.id}
                      className="stat-card animate-slide-up flex flex-col"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      {/* Card Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground leading-tight">{asset.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono">{asset.type}</p>
                        </div>
                        {/* Live status badge */}
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                          asset.status === "Available"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : asset.status === "In Use / Hiram"
                            ? "bg-warning/10 text-warning border-warning/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}>
                          {asset.status}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Wrench className="h-3.5 w-3.5 shrink-0" />
                          <span>₱{asset.daily_rate.toLocaleString("en-PH")} / day</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{asset.totalRentals} total rentals</p>
                      </div>

                      {/* Operating Hours Bar */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground font-medium">Operating Hours</span>
                          <div className="flex items-center gap-1.5">
                            {zone === "critical" && (
                              <AlertCircle className="h-3.5 w-3.5 text-destructive animate-pulse" />
                            )}
                            <span className={`font-bold ${
                              zone === "critical"
                                ? "text-destructive"
                                : zone === "warning"
                                ? "text-warning"
                                : "text-primary"
                            }`}>
                              {asset.operating_hours}/{MAX_HOURS_BEFORE_SERVICE} hrs
                            </span>
                          </div>
                        </div>
                        <Progress value={pct} className={`h-2.5 rounded-full ${barColors[zone]}`} />
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-2 mt-auto pt-1">
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-9">
                          View Usage Logs
                        </Button>
                        {zone === "critical" || asset.status === "Under Maintenance" ? (
                          <Button
                            size="sm"
                            className="flex-1 text-xs h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Dispatch Maintenance
                          </Button>
                        ) : (
                          <Button size="sm" className="flex-1 text-xs h-9">
                            {asset.status === "Available" ? "Available" : "In Use"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {assets.length === 0 && (
                  <div className="col-span-3 py-16 text-center text-muted-foreground text-sm">
                    No equipment found in the database.
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Assets;