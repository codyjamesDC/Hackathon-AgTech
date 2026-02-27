import { Tractor, Package, Wrench } from "lucide-react";

const metrics = [
  {
    title: "Active Rentals Today",
    value: "12",
    icon: Tractor,
    change: "+3 from yesterday",
    variant: "default" as const,
  },
  {
    title: "Available Equipment",
    value: "8",
    icon: Package,
    change: "of 20 total units",
    variant: "default" as const,
  },
  {
    title: "Pending Maintenance",
    value: "2",
    icon: Wrench,
    change: "Needs attention",
    variant: "danger" as const,
  },
];

export function MetricsRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {metrics.map((metric, i) => (
        <div
          key={metric.title}
          className="stat-card animate-slide-up"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </p>
              <p
                className={`text-3xl font-bold mt-1 ${
                  metric.variant === "danger"
                    ? "text-destructive"
                    : "text-foreground"
                }`}
              >
                {metric.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                {metric.change}
              </p>
            </div>
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                metric.variant === "danger"
                  ? "bg-destructive/10"
                  : "bg-primary/10"
              }`}
            >
              <metric.icon
                className={`h-5 w-5 ${
                  metric.variant === "danger"
                    ? "text-destructive"
                    : "text-primary"
                }`}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
