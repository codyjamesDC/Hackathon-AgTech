import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  MapPin,
  Wrench,
  Tractor,
  Droplets,
  Wheat,
  Cog,
  AlertCircle,
} from "lucide-react";

interface Asset {
  name: string;
  id: string;
  icon: typeof Tractor;
  location: string;
  operatingHrs: number;
  maxHrs: number;
  lastMaintenance: string;
  totalRentals: number;
}

const assets: Asset[] = [
  { name: "Tractor Unit 1", id: "TRC-001", icon: Tractor, location: "Brgy. San Isidro", operatingHrs: 42, maxHrs: 100, lastMaintenance: "2026-02-15", totalRentals: 142 },
  { name: "Tractor Unit 2", id: "TRC-002", icon: Tractor, location: "Coop Yard", operatingHrs: 78, maxHrs: 100, lastMaintenance: "2026-02-20", totalRentals: 118 },
  { name: "Combine Harvester A", id: "HV-001", icon: Wheat, location: "Brgy. Mabini", operatingHrs: 95, maxHrs: 100, lastMaintenance: "2026-02-10", totalRentals: 156 },
  { name: "Hand Tractor", id: "HT-001", icon: Cog, location: "Coop Yard", operatingHrs: 30, maxHrs: 100, lastMaintenance: "2026-02-27", totalRentals: 87 },
  { name: "Water Pump #01", id: "WP-001", icon: Droplets, location: "Coop Yard", operatingHrs: 55, maxHrs: 100, lastMaintenance: "2026-02-22", totalRentals: 64 },
  { name: "Water Pump #02", id: "WP-002", icon: Droplets, location: "Brgy. Rizal", operatingHrs: 88, maxHrs: 100, lastMaintenance: "2026-02-18", totalRentals: 71 },
  { name: "Rice Thresher", id: "RT-001", icon: Wheat, location: "Coop Yard", operatingHrs: 22, maxHrs: 100, lastMaintenance: "2026-02-12", totalRentals: 52 },
  { name: "Harvester B", id: "HV-002", icon: Wheat, location: "Repair Shop", operatingHrs: 61, maxHrs: 100, lastMaintenance: "2026-02-25", totalRentals: 98 },
];

function getHealthZone(hrs: number, max: number) {
  const pct = (hrs / max) * 100;
  if (pct > 90) return "critical";
  if (pct >= 75) return "warning";
  return "healthy";
}

const barColors = {
  healthy: "[&>div]:bg-primary",
  warning: "[&>div]:bg-warning",
  critical: "[&>div]:bg-destructive",
};

const Assets = () => {
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

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Assets", value: assets.length, color: "text-foreground" },
              { label: "Healthy", value: assets.filter((a) => getHealthZone(a.operatingHrs, a.maxHrs) === "healthy").length, color: "text-primary" },
              { label: "Needs Attention", value: assets.filter((a) => getHealthZone(a.operatingHrs, a.maxHrs) !== "healthy").length, color: "text-destructive" },
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
              const zone = getHealthZone(asset.operatingHrs, asset.maxHrs);
              const pct = Math.round((asset.operatingHrs / asset.maxHrs) * 100);
              const Icon = asset.icon;

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
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground leading-tight">{asset.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{asset.id}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{asset.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wrench className="h-3.5 w-3.5 shrink-0" />
                      <span>Last serviced: {asset.lastMaintenance}</span>
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
                        <span
                          className={`font-bold ${
                            zone === "critical"
                              ? "text-destructive"
                              : zone === "warning"
                              ? "text-warning"
                              : "text-primary"
                          }`}
                        >
                          {asset.operatingHrs}/{asset.maxHrs} hrs
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
                    {zone === "critical" ? (
                      <Button
                        size="sm"
                        className="flex-1 text-xs h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Dispatch Maintenance
                      </Button>
                    ) : (
                      <Button size="sm" className="flex-1 text-xs h-9">
                        Available
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Assets;
