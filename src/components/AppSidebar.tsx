import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Package,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sprout,
  Activity,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { title: "Command Center", path: "/", icon: LayoutDashboard, description: "Live overview" },
  { title: "Digital Logbook", path: "/logbook", icon: BookOpen, description: "Activity logs" },
  { title: "Asset Tracker", path: "/assets", icon: Package, description: "Equipment status" },
  { title: "Walk-In Override", path: "/override", icon: UserPlus, description: "Manual entry" },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  return (
    <aside
      className={`relative flex flex-col text-sidebar-foreground transition-all duration-300 ease-in-out ${
        collapsed ? "w-[72px]" : "w-64"
      } min-h-screen`}
      style={{ background: "hsl(210 40% 8%)", borderRight: "1px solid hsl(210 30% 14%)" }}
    >
      {/* Top glow */}
      <div
        className="absolute top-0 left-0 w-full h-40 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 40% 0%, hsl(158 64% 42% / 0.18) 0%, transparent 70%)" }}
      />

      {/* Bottom glow */}
      <div
        className="absolute bottom-0 left-0 w-full h-32 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 100%, hsl(158 64% 28% / 0.1) 0%, transparent 70%)" }}
      />

      {/* Header */}
      <div
        className={`relative flex items-center gap-3 px-4 py-5 transition-all duration-300 ${collapsed ? "justify-center" : ""}`}
        style={{ borderBottom: "1px solid hsl(210 30% 14%)" }}
      >
        <div className="relative shrink-0">
          <div
            className="absolute inset-0 rounded-xl opacity-40"
            style={{ background: "hsl(158 64% 42% / 0.3)", animation: "pulse 3s ease-in-out infinite" }}
          />
          <div
            className="relative w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(158 64% 28%), hsl(162 55% 20%))",
              boxShadow: "0 0 12px hsl(158 64% 42% / 0.4)",
            }}
          >
            <Sprout className="h-5 w-5 text-white" />
          </div>
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight" style={{ color: "hsl(200 20% 95%)" }}>
              eBukid
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "hsl(158 64% 42%)", animation: "pulse 2s ease-in-out infinite" }}
              />
              <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "hsl(200 20% 55%)" }}>
                Co-op Platform
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-3 py-4 space-y-1">
        {!collapsed && (
          <p className="text-[10px] font-semibold tracking-widest uppercase px-3 mb-3" style={{ color: "hsl(200 20% 35%)" }}>
            Navigation
          </p>
        )}

        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const hovered = hoveredPath === item.path;

          return (
            <div key={item.path} className="relative group">
              {/* Active left bar */}
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full transition-all duration-300"
                style={{
                  width: "3px",
                  height: active ? "32px" : "0px",
                  background: "hsl(158 64% 42%)",
                  boxShadow: active ? "0 0 8px hsl(158 64% 42% / 0.6)" : "none",
                  opacity: active ? 1 : 0,
                }}
              />

              <Link
                to={item.path}
                onMouseEnter={() => setHoveredPath(item.path)}
                onMouseLeave={() => setHoveredPath(null)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 overflow-hidden ${collapsed ? "justify-center" : ""}`}
                style={{
                  background: active ? "hsl(158 64% 42% / 0.12)" : hovered ? "hsl(210 35% 14%)" : "transparent",
                  color: active ? "hsl(158 64% 55%)" : hovered ? "hsl(200 20% 92%)" : "hsl(200 20% 65%)",
                  border: active ? "1px solid hsl(158 64% 42% / 0.2)" : "1px solid transparent",
                }}
              >
                {hovered && !active && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, hsl(158 64% 42% / 0.05) 50%, transparent 100%)",
                      animation: "shimmer 1.2s ease-in-out",
                    }}
                  />
                )}

                <item.icon
                  className="shrink-0 transition-all duration-200"
                  style={{
                    width: "18px",
                    height: "18px",
                    color: active ? "hsl(158 64% 55%)" : undefined,
                    filter: active ? "drop-shadow(0 0 4px hsl(158 64% 42% / 0.5))" : "none",
                    transform: active ? "scale(1.1)" : "scale(1)",
                  }}
                />

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{item.title}</span>
                    {active && (
                      <span className="block text-[10px] truncate mt-0.5 font-normal" style={{ color: "hsl(158 64% 42% / 0.8)" }}>
                        {item.description}
                      </span>
                    )}
                  </div>
                )}

                {active && !collapsed && (
                  <div className="shrink-0 relative w-1.5 h-1.5">
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{ background: "hsl(158 64% 42%)", animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite", opacity: 0.4 }}
                    />
                    <span className="relative block w-1.5 h-1.5 rounded-full" style={{ background: "hsl(158 64% 42%)" }} />
                  </div>
                )}
              </Link>

              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150">
                  <div className="rounded-lg px-3 py-2 shadow-xl whitespace-nowrap" style={{ background: "hsl(210 40% 12%)", border: "1px solid hsl(210 30% 20%)" }}>
                    <p className="text-xs font-semibold" style={{ color: "hsl(200 20% 92%)" }}>{item.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "hsl(200 20% 50%)" }}>{item.description}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* System Status */}
      {!collapsed && (
        <div
          className="relative mx-3 mb-3 rounded-lg px-3 py-2.5"
          style={{ background: "hsl(158 64% 28% / 0.08)", border: "1px solid hsl(158 64% 28% / 0.15)" }}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" style={{ color: "hsl(158 64% 42%)" }} />
            <span className="text-[11px] font-medium" style={{ color: "hsl(158 64% 55%)" }}>System Online</span>
            <div className="ml-auto flex items-end gap-0.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full"
                  style={{
                    height: `${6 + i * 2}px`,
                    background: i <= 3 ? "hsl(158 64% 42%)" : "hsl(210 30% 25%)",
                    animation: `pulse ${0.8 + i * 0.2}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mx-3 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(210 30% 20%), transparent)" }} />

      {/* Profile + Collapse */}
        <div className={`relative flex items-center px-3 py-4 transition-all duration-300 ${
          collapsed ? "justify-center" : "justify-between gap-3"
        }`}>
          
          {/* Avatar + Info — hide completely when collapsed */}
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(158 64% 28% / 0.3), hsl(210 35% 18%))",
                    border: "1px solid hsl(158 64% 42% / 0.3)",
                  }}
                >
                  <Shield className="h-4 w-4" style={{ color: "hsl(158 64% 55%)" }} />
                </div>
                <span
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                  style={{
                    background: "hsl(158 64% 42%)",
                    border: "2px solid hsl(210 40% 8%)",
                    boxShadow: "0 0 6px hsl(158 64% 42% / 0.6)",
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "hsl(200 20% 88%)" }}>
                  Co-op Admin
                </p>
                <p className="text-[10px] truncate" style={{ color: "hsl(200 20% 40%)" }}>
                  Administrator
                </p>
              </div>
            </div>
          )}

          {/* Collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 shrink-0"
            style={{
              background: "hsl(210 35% 14%)",
              border: "1px solid hsl(210 30% 20%)",
              color: "hsl(200 20% 50%)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "hsl(158 64% 28% / 0.2)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(158 64% 42% / 0.4)";
              (e.currentTarget as HTMLButtonElement).style.color = "hsl(158 64% 55%)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "hsl(210 35% 14%)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(210 30% 20%)";
              (e.currentTarget as HTMLButtonElement).style.color = "hsl(200 20% 50%)";
            }}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </aside>
  );
}