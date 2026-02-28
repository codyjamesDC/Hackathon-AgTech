import { CalendarDays, User } from "lucide-react";

export function DashboardHeader() {
  const today = "Thursday, March 5, 2026";

  return (
    <header className="flex items-center justify-between bg-card px-6 py-4 border-b border-border">
      <div className="flex items-center gap-3 text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        <span className="text-sm font-medium">{today}</span>
      </div>

      <div className="flex items-center gap-5">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className="relative h-2.5 w-2.5">
            <span className="absolute inset-0 rounded-full bg-primary pulse-dot" />
            <span className="relative block h-2.5 w-2.5 rounded-full bg-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            System Status:{" "}
            <span className="text-primary font-semibold">SMS Gateway Online</span>
          </span>
        </div>

        {/* Admin avatar */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium hidden sm:inline">Co-op Admin</span>
        </div>
      </div>
    </header>
  );
}
