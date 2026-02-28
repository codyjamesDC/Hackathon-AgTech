import { MessageSquare } from "lucide-react";

interface SmsMessage {
  sender: string;
  content: string;
  time: string;
  type: "incoming" | "system";
}

const messages: SmsMessage[] = [
  {
    sender: "System",
    content: "✅ Confirmed! TRACTOR booked para kay JUAN sa 03-05. Pupunta si Operator Jun ng 6AM. Text KANSELA TRACTOR 03-05 kung may pagbabago.",
    time: "Just now",
    type: "system",
  },
  {
    sender: "0919-XXX-1234",
    content: "YES",
    time: "1 min ago",
    type: "incoming",
  },
  {
    sender: "System",
    content: "TRACTOR ay maaring hiramin sa petsa ng 03-05-2026 mula 06:00 AM - 05:00 PM. Mag-reply ng YES kung nais magpatuloy. Nakatakdang kunin sa: Brgy. Hall.",
    time: "2 mins ago",
    type: "system",
  },
  {
    sender: "0919-XXX-1234",
    content: "HIRAM JUAN TRACTOR 03-05",
    time: "2 mins ago",
    type: "incoming",
  },
];

export function SmsFeed() {
  return (
    <div className="stat-card animate-slide-up flex flex-col" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold">Live SMS Feed</h2>
      </div>
      <div className="space-y-3 flex-1">
        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col gap-1 rounded-lg p-2 -mx-2 transition-all duration-150 hover:bg-muted/50 hover:shadow-md cursor-pointer">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold ${
                  msg.type === "system"
                    ? "text-primary"
                    : "text-foreground"
                }`}
              >
                {msg.sender}
              </span>
              <span className="text-[10px] text-muted-foreground">{msg.time}</span>
            </div>
            <div
              className={`sms-bubble ${
                msg.type === "system" ? "sms-bubble-system" : "sms-bubble-incoming"
              }`}
            >
              <span className={msg.type === "incoming" ? "font-mono" : ""}>
                {msg.content}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
