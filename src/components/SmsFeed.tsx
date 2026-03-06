import { MessageSquare, Loader2, Radio, RefreshCw, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format, isToday, isYesterday, subMinutes, subHours, subDays, isAfter } from "date-fns";
import { useState, useEffect, useRef, useMemo } from "react";

interface FeedMessage {
  id: string;
  sender: string;
  content: string;
  time: string;
  type: "incoming" | "system";
  createdAt: Date;
}

type TimeFilter = "15m" | "1h" | "6h" | "24h" | "all";

const TIME_FILTERS: { label: string; value: TimeFilter }[] = [
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
  { label: "All", value: "all" },
];

function getCutoff(filter: TimeFilter): Date | null {
  const now = new Date();
  if (filter === "15m") return subMinutes(now, 15);
  if (filter === "1h") return subHours(now, 1);
  if (filter === "6h") return subHours(now, 6);
  if (filter === "24h") return subDays(now, 1);
  return null;
}

function formatBookingDate(createdAt: string): string {
  const d = new Date(createdAt);
  const timeStr = format(d, "h:mm a");
  if (isToday(d)) return `Today ${timeStr}`;
  if (isYesterday(d)) return `Yesterday ${timeStr}`;
  return format(d, "MMM d, yyyy · h:mm a");
}

async function fetchSmsFeed(): Promise<FeedMessage[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, sms_raw, start_date, created_at, status, farmers ( alias, phone_number ), equipment ( name )")
    .not("sms_raw", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  const messages: FeedMessage[] = [];

  for (const t of data ?? []) {
    const dateLabel = formatBookingDate(t.created_at);
    const farmer = t.farmers as any;
    const equip = t.equipment as any;
    const phone = farmer?.phone_number ?? "Unknown";
    const alias = farmer?.alias ?? "Unknown";
    const equipment = equip?.name ?? "Unknown";
    const createdAt = new Date(t.created_at);

    if (t.sms_raw) {
      messages.push({
        id: `in-${t.id}`,
        sender: phone,
        content: t.sms_raw,
        time: dateLabel,
        type: "incoming",
        createdAt,
      });
    }

    messages.push({
      id: `sys-${t.id}`,
      sender: "System",
      content: `✅ Kumpirmado! ${equipment} na-book para kay ${alias} sa ${t.start_date}. Ref#: ${t.id.slice(0, 8).toUpperCase()}`,
      time: dateLabel,
      type: "system",
      createdAt,
    });
  }

  return messages;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "800ms" }}
        />
      ))}
    </span>
  );
}

export function SmsFeed() {
  const [prevCount, setPrevCount] = useState(0);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const feedRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ["sms-feed"],
    queryFn: fetchSmsFeed,
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (messages.length > prevCount && prevCount > 0) {
      const incoming = new Set(messages.slice(0, messages.length - prevCount).map((m) => m.id));
      setNewIds(incoming);
      setTimeout(() => setNewIds(new Set()), 3000);
    }
    setPrevCount(messages.length);
  }, [messages.length]);

  const filtered = useMemo(() => {
    const cutoff = getCutoff(timeFilter);
    if (!cutoff) return messages;
    return messages.filter((m) => isAfter(m.createdAt, cutoff));
  }, [messages, timeFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="stat-card animate-slide-up flex flex-col h-full" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-5 h-5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary/30 animate-ping" />
            <Radio className="relative h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="text-base font-semibold tracking-tight">Live SMS Feed</h2>
          {!isLoading && filtered.length > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {filtered.length}
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Time Filter Tabs */}
      <div className="flex items-center gap-1 mb-3 p-1 rounded-lg bg-muted/40 border border-border/50">
        <Clock className="h-3 w-3 text-muted-foreground ml-1 shrink-0" />
        {TIME_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setTimeFilter(f.value)}
            className={`flex-1 text-[11px] font-medium py-1 px-1.5 rounded-md transition-all duration-150
              ${timeFilter === f.value
                ? "bg-background text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative mb-3 h-px">
        <div className="absolute inset-0 bg-border" />
        <div className="absolute left-0 h-px w-1/3 bg-gradient-to-r from-primary/60 to-transparent animate-pulse" />
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
          <div className="relative">
            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
          </div>
          <span className="text-xs">Connecting to SMS gateway<TypingDots /></span>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />
            <MessageSquare className="relative h-10 w-10 text-primary/20" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {timeFilter === "all" ? "Awaiting transmissions" : `No messages in the last ${timeFilter}`}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {timeFilter === "all"
                ? <><span>No SMS activity yet</span><TypingDots /></>
                : <button onClick={() => setTimeFilter("all")} className="text-primary hover:underline">View all messages</button>
              }
            </p>
          </div>
        </div>
      )}

      <div ref={feedRef} className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {filtered.map((msg, index) => {
          const isNew = newIds.has(msg.id);
          const isIncoming = msg.type === "incoming";
          return (
            <div
              key={msg.id}
              className={`group flex flex-col gap-1.5 rounded-xl p-3 transition-all duration-300 cursor-pointer border
                ${isNew
                  ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/10"
                  : "border-transparent hover:border-border hover:bg-muted/40"
                }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0
                    ${isIncoming
                      ? "bg-muted text-muted-foreground border border-border"
                      : "bg-primary/15 text-primary border border-primary/25"
                    }`}
                  >
                    {isIncoming ? "📱" : "S"}
                  </div>
                  <span className={`text-xs font-semibold tracking-tight ${isIncoming ? "text-foreground font-mono" : "text-primary"}`}>
                    {msg.sender}
                  </span>
                  {isNew && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-primary text-primary-foreground animate-pulse">
                      NEW
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
                  {msg.time}
                </span>
              </div>
              <div className={`rounded-lg px-3 py-2 text-xs leading-relaxed transition-all duration-200
                ${isIncoming
                  ? "bg-muted/60 text-foreground font-mono tracking-wide border border-border/50 group-hover:bg-muted"
                  : "bg-primary/8 text-foreground border border-primary/15 group-hover:bg-primary/12"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && messages.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/60">
            {filtered.length} of {messages.length} messages
          </span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-primary/70 font-medium">Live</span>
          </div>
        </div>
      )}
    </div>
  );
}