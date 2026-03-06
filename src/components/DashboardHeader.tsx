import { CalendarDays, Wifi, WifiOff, Bell, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

export function DashboardHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const time = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header
      className="relative flex items-center justify-between px-6 py-3 border-b border-border/60 overflow-hidden"
      style={{
        background: "hsl(0 0% 100%)",
        boxShadow: "0 1px 8px hsl(215 30% 10% / 0.06)",
      }}
    >
      {/* Subtle top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(158 64% 28% / 0.5), transparent)",
        }}
      />

      {/* Left — Date & Time */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(158 64% 28% / 0.08)", border: "1px solid hsl(158 64% 28% / 0.15)" }}
          >
            <CalendarDays className="h-4 w-4" style={{ color: "hsl(158 64% 28%)" }} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{today}</p>
            <p
              className="text-sm font-bold font-mono tracking-wider"
              style={{ color: "hsl(215 30% 10%)" }}
            >
              {time}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border/60 hidden sm:block" />

        {/* SMS Gateway status */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: isOnline ? "hsl(158 64% 28% / 0.06)" : "hsl(0 72% 51% / 0.06)",
            border: `1px solid ${isOnline ? "hsl(158 64% 28% / 0.15)" : "hsl(0 72% 51% / 0.15)"}`,
          }}
        >
          {/* Animated pulse */}
          <div className="relative w-2 h-2">
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: isOnline ? "hsl(158 64% 42%)" : "hsl(0 72% 51%)",
                animation: isOnline ? "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" : "none",
                opacity: 0.4,
              }}
            />
            <span
              className="relative block w-2 h-2 rounded-full"
              style={{ background: isOnline ? "hsl(158 64% 42%)" : "hsl(0 72% 51%)" }}
            />
          </div>
          {isOnline
            ? <Wifi className="h-3 w-3" style={{ color: "hsl(158 64% 42%)" }} />
            : <WifiOff className="h-3 w-3" style={{ color: "hsl(0 72% 51%)" }} />
          }
          <span
            className="text-xs font-semibold"
            style={{ color: isOnline ? "hsl(158 64% 32%)" : "hsl(0 72% 51%)" }}
          >
            SMS Gateway {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* Right — Notifications + Admin */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-muted"
          style={{ border: "1px solid hsl(var(--border))" }}
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {/* Notification badge */}
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
            style={{ background: "hsl(158 64% 28%)" }}
          >
            3
          </span>
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-border/60" />

        {/* Admin profile */}
        <button
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:bg-muted group"
          style={{ border: "1px solid transparent" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(var(--border))";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
          }}
        >
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(158 64% 28%), hsl(162 55% 20%))",
              boxShadow: "0 0 8px hsl(158 64% 28% / 0.3)",
            }}
          >
            CA
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-foreground leading-tight">Co-op Admin</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Administrator</p>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block transition-transform duration-200 group-hover:rotate-180" />
        </button>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </header>
  );
}