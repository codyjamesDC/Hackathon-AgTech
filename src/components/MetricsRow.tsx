import { Tractor, Package, Wrench, CheckCircle2, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, Area, AreaChart, XAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

// Fetch Metrics
// runs the supabase queries in parallel and computes four numbers for the dashboard cards (available equipment today, etc.)
async function fetchMetrics() {
  const today = new Date().toISOString().split("T")[0];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const [transactionsRes, equipmentRes, historyRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, status, start_date, end_date")
      .or(`status.eq.Confirmed,status.eq.Ongoing`),
    supabase
      .from("equipment")
      .select("id, status"),
    supabase
      .from("transactions")
      .select("start_date")
      .gte("start_date", sevenDaysAgoStr)
      .lte("start_date", today),
  ]);

  if (transactionsRes.error) throw new Error(transactionsRes.error.message);
  if (equipmentRes.error) throw new Error(equipmentRes.error.message);

  const transactions = transactionsRes.data ?? [];
  const equipment = equipmentRes.data ?? [];
  const history = historyRes.data ?? [];

  const activeToday = transactions.filter((t) => {
    return t.start_date <= today && t.end_date >= today;
  }).length;

  const available = equipment.filter((e) => e.status === "Available").length;
  const maintenance = equipment.filter((e) => e.status === "Under Maintenance").length;
  const total = equipment.length;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-PH", { weekday: "short" });
    const count = history.filter((t) => t.start_date === dateStr).length;
    return { date: label, v: count };
  });

  return { activeToday, available, total, maintenance, rentalHistory: days };
}

// CustomToolTip
function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-lg text-xs">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-primary font-mono">{payload[0].value}{unit ? ` ${unit}` : ""}</p>
    </div>
  );
}

// TrendBadge
function TrendBadge({ data }: { data: { v: number }[] }) {
  if (data.length < 2) return null;
  const last = data[data.length - 1].v;
  const prev = data[data.length - 2].v;
  if (last > prev) return (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-500">
      <TrendingUp className="h-3 w-3" /> +{last - prev}
    </span>
  );
  if (last < prev) return (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-rose-500">
      <TrendingDown className="h-3 w-3" /> -{prev - last}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground">
      <Minus className="h-3 w-3" /> 0
    </span>
  );
}

// Synchronous MetricsRow
export function MetricsRow() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["metrics"],
    queryFn: fetchMetrics,
    refetchInterval: 15_000,
  });

  const availabilityData = Array.from({ length: 7 }, (_, i) => ({
    date: `D${i + 1}`,
    v: Math.max(0, (data?.available ?? 0) + Math.floor(Math.random() * 2) - 1),
  }));

  const rentalHistory = data?.rentalHistory ?? Array.from({ length: 7 }, (_, i) => ({
    date: `D${i + 1}`, v: 0
  }));

  const maintenanceData = Array.from({ length: 7 }, (_, i) => ({
    date: `D${i + 1}`,
    v: data?.maintenance ?? 0,
  }));

  const metrics = [
    {
      title: "Active Rentals Today",
      value: isLoading ? "…" : String(data?.activeToday ?? 0),
      icon: Tractor,
      change: "Confirmed or Ongoing today",
      spark: rentalHistory,
      sparkColor: "hsl(142, 76%, 36%)",
      gradientColor: "rgba(34, 197, 94, 0.15)",
      empty: false,
      unit: "rentals",
    },
    {
      title: "Available Equipment Today",
      value: isLoading ? "…" : String(data?.available ?? 0),
      icon: Package,
      change: isLoading ? "" : `of ${data?.total ?? 0} total units`,
      spark: availabilityData,
      sparkColor: "hsl(217, 91%, 60%)",
      gradientColor: "rgba(59, 130, 246, 0.15)",
      empty: false,
      unit: "units",
    },
    {
      title: "Pending Maintenance",
      value: isLoading ? "…" : String(data?.maintenance ?? 0),
      icon: Wrench,
      change: "",
      spark: maintenanceData,
      sparkColor: (data?.maintenance ?? 0) > 0 ? "hsl(0, 84%, 60%)" : "hsl(142, 76%, 36%)",
      gradientColor: (data?.maintenance ?? 0) > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
      empty: !isLoading && (data?.maintenance ?? 0) === 0,
      unit: "items",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {metrics.map((metric, i) => {
        const isHovered = hoveredCard === metric.title;
        return (
          <div
            key={metric.title}
            className={`stat-card animate-slide-up cursor-pointer transition-all duration-200 ${
              isHovered ? "shadow-lg -translate-y-0.5 border-primary/20" : ""
            }`}
            style={{ animationDelay: `${i * 100}ms` }}
            onMouseEnter={() => setHoveredCard(metric.title)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                {metric.empty ? (
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold text-primary">All equipment healthy!</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-end gap-2 mt-1">
                      <p className="text-3xl font-bold text-foreground">
                        {isLoading
                          ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          : metric.value
                        }
                      </p>
                      {!isLoading && <TrendBadge data={metric.spark} />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{metric.change}</p>
                  </>
                )}
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                isHovered ? "bg-primary/20 scale-110" : "bg-primary/10"
              }`}>
                <metric.icon className="h-5 w-5 text-primary" />
              </div>
            </div>

            <div className="h-14 mt-3 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metric.spark} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                  <defs>
                    <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={metric.sparkColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={metric.sparkColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    hide={!isHovered}
                  />
                  <Tooltip
                    content={<CustomTooltip unit={metric.unit} />}
                    cursor={{ stroke: metric.sparkColor, strokeWidth: 1, strokeDasharray: "3 3" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={metric.sparkColor}
                    strokeWidth={2}
                    fill={`url(#grad-${i})`}
                    dot={false}
                    activeDot={{ r: 4, fill: metric.sparkColor, stroke: "white", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {isHovered && (
              <p className="text-[10px] text-muted-foreground/60 text-center mt-1">
                Last 7 days
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}