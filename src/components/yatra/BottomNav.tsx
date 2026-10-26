import { Link, useLocation } from "@tanstack/react-router";
import { Home, Map, Bell, Flame, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/navigate", label: "Routes", icon: Map },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/heatmap", label: "Heatmap", icon: Flame },
  { to: "/profile", label: "Me", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-2 z-30 pointer-events-none">
      <nav className="pointer-events-auto bg-card/85 backdrop-blur-xl border border-border rounded-2xl shadow-elevated flex justify-between px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_var(--primary)]" : ""}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
