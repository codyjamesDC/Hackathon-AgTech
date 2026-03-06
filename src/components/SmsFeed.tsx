import { MessageSquare, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format, isToday, isYesterday } from "date-fns";

interface FeedMessage {
  id: string;
  sender: string;
  content: string;
  time: string;
  type: "incoming" | "system";
}

// Shows "Today", "Yesterday", or the actual date — based on start_date
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
    .limit(10);

  if (error) throw new Error(error.message);

  const messages: FeedMessage[] = [];

  for (const t of data ?? []) {
    const dateLabel = formatBookingDate(t.start_date);
    const farmer = t.farmers as any;
    const equip = t.equipment as any;
    const phone = farmer?.phone_number ?? "Unknown";
    const alias = farmer?.alias ?? "Unknown";
    const equipment = equip?.name ?? "Unknown";

    // Incoming SMS bubble
    if (t.sms_raw) {
      messages.push({
        id: `in-${t.id}`,
        sender: phone,
        content: t.sms_raw,
        time: dateLabel,
        type: "incoming",
      });
    }

    // System confirmation bubble
    messages.push({
      id: `sys-${t.id}`,
      sender: "System",
      content: `✅ Kumpirmado! ${equipment} na-book para kay ${alias} sa ${t.start_date}. Ref#: ${t.id.slice(0, 8).toUpperCase()}`,
      time: dateLabel,
      type: "system",
    });
  }

  return messages;
}

export function SmsFeed() {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["sms-feed"],
    queryFn: fetchSmsFeed,
    refetchInterval: 10_000,
  });

  return (
    <div className="stat-card animate-slide-up flex flex-col" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold">Live SMS Feed</h2>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading messages...</span>
        </div>
      )}

      {!isLoading && messages.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No SMS activity yet. Waiting for incoming bookings...
        </p>
      )}

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px]">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-1 rounded-lg p-2 -mx-2 transition-all duration-150 hover:bg-muted/50 hover:shadow-md cursor-pointer">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${msg.type === "system" ? "text-primary" : "text-foreground"}`}>
                {msg.sender}
              </span>
              <span className="text-[10px] text-muted-foreground">{msg.time}</span>
            </div>
            <div className={`sms-bubble ${msg.type === "system" ? "sms-bubble-system" : "sms-bubble-incoming"}`}>
              <span className={msg.type === "incoming" ? "font-mono" : ""}>{msg.content}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}