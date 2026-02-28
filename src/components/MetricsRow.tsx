import { Tractor, Package, Wrench, CheckCircle2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const sparkData = {
  rentals: [
    { v: 8 }, { v: 10 }, { v: 9 }, { v: 11 }, { v: 10 }, { v: 13 }, { v: 12 },
  ],
  available: [
    { v: 10 }, { v: 9 }, { v: 11 }, { v: 8 }, { v: 7 }, { v: 9 }, { v: 8 },
  ],
  maintenance: [
    { v: 4 }, { v: 3 }, { v: 5 }, { v: 3 }, { v: 2 }, { v: 1 }, { v: 0 },
  ],
};

const metrics = [
  {
    title: "Active Rentals Today",
    value: "14",
    icon: Tractor,
    change: "+4 from yesterday",
    variant: "default" as const,
    spark: sparkData.rentals,
    sparkColor: "hsl(var(--primary))",
  },
  {
    title: "Available Equipment",
    value: "8",
    icon: Package,
    change: "of 20 total units",
    variant: "default" as const,
    spark: sparkData.available,
    sparkColor: "hsl(var(--primary))",
  },
  {
    title: "Pending Maintenance",
    value: "0",
    icon: Wrench,
    change: "",
    variant: "success" as const,
    spark: sparkData.maintenance,
    sparkColor: "hsl(var(--primary))",
    empty: true,
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </p>
              {metric.empty ? (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    All equipment healthy!
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold mt-1 text-foreground">
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {metric.change}
                  </p>
                </>
              )}
            </div>
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                metric.empty
                  ? "bg-primary/10"
                  : "bg-primary/10"
              }`}
            >
              <metric.icon className="h-5 w-5 text-primary" />
            </div>
          </div>
          {/* Sparkline */}
          <div className="h-10 mt-3 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metric.spark}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={metric.sparkColor}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
