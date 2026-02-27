import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, MapPin, Wrench, CheckCircle, AlertTriangle, Clock } from "lucide-react";

type AssetStatus = "Available" | "In Use" | "Maintenance";

interface Asset {
  name: string;
  id: string;
  status: AssetStatus;
  location: string;
  utilizationPct: number;
  lastMaintenance: string;
  totalRentals: number;
}

const assets: Asset[] = [
  { name: "4-Wheel Tractor", id: "TRC-001", status: "In Use", location: "Brgy. San Isidro", utilizationPct: 85, lastMaintenance: "2026-02-15", totalRentals: 142 },
  { name: "4-Wheel Tractor", id: "TRC-002", status: "Available", location: "Coop Yard", utilizationPct: 72, lastMaintenance: "2026-02-20", totalRentals: 118 },
  { name: "Hand Tractor", id: "HT-001", status: "In Use", location: "Brgy. Mabini", utilizationPct: 68, lastMaintenance: "2026-02-10", totalRentals: 95 },
  { name: "Hand Tractor", id: "HT-002", status: "Maintenance", location: "Repair Shop", utilizationPct: 45, lastMaintenance: "2026-02-27", totalRentals: 87 },
  { name: "Water Pump #01", id: "WP-001", status: "Available", location: "Coop Yard", utilizationPct: 55, lastMaintenance: "2026-02-22", totalRentals: 64 },
  { name: "Water Pump #02", id: "WP-002", status: "In Use", location: "Brgy. Rizal", utilizationPct: 62, lastMaintenance: "2026-02-18", totalRentals: 71 },
  { name: "Rice Thresher", id: "RT-001", status: "Available", location: "Coop Yard", utilizationPct: 38, lastMaintenance: "2026-02-12", totalRentals: 52 },
  { name: "Harvester", id: "HV-001", status: "Maintenance", location: "Repair Shop", utilizationPct: 90, lastMaintenance: "2026-02-27", totalRentals: 156 },
];

const statusConfig: Record<AssetStatus, { icon: typeof CheckCircle; colorClass: string; badgeClass: string }> = {
  Available: { icon: CheckCircle, colorClass: "text-primary", badgeClass: "bg-primary/10 text-primary border-primary/20" },
  "In Use": { icon: Clock, colorClass: "text-warning", badgeClass: "bg-warning/10 text-warning border-warning/20" },
  Maintenance: { icon: AlertTriangle, colorClass: "text-destructive", badgeClass: "bg-destructive/10 text-destructive border-destructive/20" },
};

const Assets = () => {
  const available = assets.filter((a) => a.status === "Available").length;
  const inUse = assets.filter((a) => a.status === "In Use").length;
  const maintenance = assets.filter((a) => a.status === "Maintenance").length;

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Asset Tracker</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor all cooperative equipment in real-time
            </p>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Available", value: available, color: "text-primary" },
              { label: "In Use", value: inUse, color: "text-warning" },
              { label: "Maintenance", value: maintenance, color: "text-destructive" },
            ].map((s) => (
              <div key={s.label} className="stat-card animate-slide-up text-center">
                <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Asset cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assets.map((asset, i) => {
              const config = statusConfig[asset.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={asset.id}
                  className="stat-card animate-slide-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{asset.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{asset.id}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs font-medium ${config.badgeClass}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {asset.status}
                    </Badge>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{asset.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wrench className="h-3.5 w-3.5" />
                      <span>Last serviced: {asset.lastMaintenance}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Utilization</span>
                        <span className="font-semibold text-foreground">{asset.utilizationPct}%</span>
                      </div>
                      <Progress value={asset.utilizationPct} className="h-1.5" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {asset.totalRentals} total rentals
                    </p>
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
