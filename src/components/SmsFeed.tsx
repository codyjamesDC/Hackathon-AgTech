import { MessageSquare } from "lucide-react";

interface SmsMessage {
  sender: string;
  content: string;
  time: string;
  type: "incoming" | "system";
}

const messages: SmsMessage[] = [
  {
    sender: "0919-XXX-1234",
    content: "END TRACTOR",
    time: "Just now",
    type: "incoming",
  },
  {
    sender: "0966-XXX-9876",
    content: "HIRAM PUMP 03-01",
    time: "2 mins ago",
    type: "incoming",
  },
  {
    sender: "System",
    content: "✅ Confirmed! Pump booked for MARIA — March 1, 08:30 AM.",
    time: "2 mins ago",
    type: "system",
  },
  {
    sender: "0917-XXX-5678",
    content: "STATUS",
    time: "8 mins ago",
    type: "incoming",
  },
  {
    sender: "System",
    content: "📋 PEDRO — Hand Tractor, 10:00 AM today. You are #3 in queue.",
    time: "8 mins ago",
    type: "system",
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
