import { Tractor, Package, Wrench, CheckCircle2, Loader2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ── Fetch live metrics from Supabase ─────────────────────────────────────────

async function fetchMetrics() {
  const today = new Date().toISOString().split("T")[0];

  const [transactionsRes, equipmentRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, status, start_date, end_date")
      .or(`status.eq.Confirmed,status.eq.Ongoing`),
    supabase
      .from("equipment")
      .select("id, status"),
  ]);

  if (transactionsRes.error) throw new Error(transactionsRes.error.message);
  if (equipmentRes.error) throw new Error(equipmentRes.error.message);

  const transactions = transactionsRes.data ?? [];
  const equipment = equipmentRes.data ?? [];

  const activeToday = transactions.filter((t) => {
    return t.start_date <= today && t.end_date >= today;
  }).length;

  const available = equipment.filter((e) => e.status === "Available").length;
  const maintenance = equipment.filter((e) => e.status === "Under Maintenance").length;
  const total = equipment.length;

  return { activeToday, available, total, maintenance };
}

// ── Component ─────────────────────────────────────────────────────────────────

const sparkPlaceholder = [
  { v: 2 }, { v: 3 }, { v: 4 }, { v: 3 }, { v: 5 }, { v: 4 }, { v: 6 },
];

export function MetricsRow() {
  const { data, isLoading } = useQuery({
    queryKey: ["metrics"],
    queryFn: fetchMetrics,
    refetchInterval: 15_000,
  });

  const metrics = [
    {
      title: "Active Rentals Today",
      value: isLoading ? "…" : String(data?.activeToday ?? 0),
      icon: Tractor,
      change: "Confirmed or Ongoing today",
      spark: sparkPlaceholder,
      sparkColor: "hsl(var(--primary))",
      empty: false,
    },
    {
      title: "Available Equipment",
      value: isLoading ? "…" : String(data?.available ?? 0),
      icon: Package,
      change: isLoading ? "" : `of ${data?.total ?? 0} total units`,
      spark: sparkPlaceholder,
      sparkColor: "hsl(var(--primary))",
      empty: false,
    },
    {
      title: "Pending Maintenance",
      value: isLoading ? "…" : String(data?.maintenance ?? 0),
      icon: Wrench,
      change: "",
      spark: sparkPlaceholder,
      sparkColor: "hsl(var(--primary))",
      empty: !isLoading && (data?.maintenance ?? 0) === 0,
    },
  ];

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
              <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
              {metric.empty ? (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-primary">All equipment healthy!</span>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold mt-1 text-foreground flex items-center gap-2">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">{metric.change}</p>
                </>
              )}
            </div>
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
              <metric.icon className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="h-10 mt-3 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metric.spark}>
                <Line type="monotone" dataKey="v" stroke={metric.sparkColor} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
