import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Package,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { title: "Command Center", path: "/", icon: LayoutDashboard },
  { title: "Digital Logbook", path: "/logbook", icon: BookOpen },
  { title: "Asset Tracker", path: "/assets", icon: Package },
  { title: "Walk-In Override", path: "/override", icon: UserPlus },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-64"
      } min-h-screen`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
        <span className="text-2xl">🚜</span>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">eBukid</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-4 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
