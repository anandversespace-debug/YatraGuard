import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Search, MapPin, Clock, Bell, Sparkles, ArrowUpRight, Phone, WifiOff, Wifi } from "lucide-react";
import { PhoneShell } from "@/components/yatra/PhoneShell";
import { BottomNav } from "@/components/yatra/BottomNav";
import { ClientOnly } from "@/components/yatra/ClientOnly";
import { SafetyMap } from "@/components/yatra/SafetyMap";
import { CITY_CENTER, HEAT_ZONES, LIVE_ALERTS, RECENT_PLACES, HOME, SUGGESTED_DESTINATION } from "@/lib/mock-data";
import { LandmarkSearchSheet } from "@/components/yatra/LandmarkSearchSheet";
import { setLastDestination } from "@/lib/destination-store";
import { useLite } from "@/lib/lite-mode";
import { track } from "@/lib/analytics-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YatraGuard — Safest route, every time" },
      { name: "description", content: "Real-time safety navigation for India. Safer routes, live risk alerts and one-tap SOS." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const safetyScore = 86;
  const [searchOpen, setSearchOpen] = useState(false);
  const [lite, setLite] = useLite();
  const navigate = useNavigate();
  useEffect(() => { track("session_started"); }, []);
  return (
    <PhoneShell>
      {/* header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl gradient-safe flex items-center justify-center glow-safe">
            <Shield className="h-5 w-5 text-safe-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">YatraGuard</p>
            <p className="text-sm font-semibold leading-tight">Hi, Aanya 👋</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLite(!lite)}
            title={lite ? "Lite mode ON — saving data" : "Switch to Lite mode"}
            className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
              lite ? "bg-info/15 border-info/40 text-info" : "bg-card border-border text-muted-foreground"
            }`}
          >
            {lite ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
          </button>
          <Link to="/alerts" className="relative h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger animate-pulse-soft" />
          </Link>
        </div>
      </div>

      {/* Safety score card */}
      <div className="rounded-3xl p-5 glass border border-border relative overflow-hidden animate-fade-in-up hover-lift">
        <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-safe/25 blur-3xl animate-pulse-soft" />
        <div className="absolute inset-0 pointer-events-none opacity-60"
             style={{ background: "radial-gradient(120% 80% at 0% 0%, oklch(0.78 0.18 155 / 0.08), transparent 60%)" }} />
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Area safety score</p>
        <div className="flex items-end justify-between mt-1">
          <div>
            <p className="num-display text-6xl font-bold leading-none">
              <span className="text-shimmer">{safetyScore}</span>
              <span className="text-xl text-muted-foreground font-medium">/100</span>
            </p>
            <p className="text-xs text-safe mt-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Indiranagar feels safe right now
            </p>
          </div>
          <div className="h-16 w-16 rounded-full border-4 border-safe/40 flex items-center justify-center glow-safe animate-pulse-soft">
            <Shield className="h-7 w-7 text-safe" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Lighting" value="Good" tone="safe" />
          <Stat label="Crowd" value="Active" tone="safe" />
          <Stat label="Alerts" value="2 nearby" tone="warning" />
        </div>
      </div>

      {/* Where to — landmark-first search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="mt-5 w-full text-left rounded-2xl p-4 bg-card border border-border flex items-center gap-3 active:scale-[0.99] transition-transform"
      >
        <Search className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Search a landmark</p>
          <p className="text-xs text-muted-foreground truncate">"Charminar", "Sector 17", "Hitec City Metro"…</p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-safe/15 text-safe font-semibold">SAFE MODE</span>
      </button>

      {/* Quick destinations */}
      <div className="mt-5 flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
        {[HOME, SUGGESTED_DESTINATION, ...RECENT_PLACES].map((p) => (
          <Link key={p.id} to="/navigate" className="shrink-0 rounded-2xl px-4 py-3 bg-card border border-border min-w-[140px]">
            <MapPin className="h-4 w-4 text-info mb-2" />
            <p className="text-sm font-medium leading-tight">{p.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{p.area}</p>
          </Link>
        ))}
      </div>

      {/* Mini map (or Lite-mode summary) */}
      {lite ? (
        <div className="mt-5 rounded-3xl border border-border p-4 bg-card flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-info/15 text-info flex items-center justify-center">
            <WifiOff className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Lite mode is on</p>
            <p className="text-[11px] text-muted-foreground">Map tiles paused to save data. Heatmap still works.</p>
          </div>
          <Link to="/heatmap" className="text-[11px] font-semibold text-primary flex items-center gap-1">
            Open <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl overflow-hidden border border-border h-56 relative">
          <ClientOnly fallback={<div className="h-full w-full bg-muted animate-pulse" />}>
            <SafetyMap
              center={CITY_CENTER}
              zoom={12}
              heatZones={HEAT_ZONES}
              alerts={LIVE_ALERTS}
              interactive={false}
              height="100%"
            />
          </ClientOnly>
          <Link
            to="/heatmap"
            className="absolute bottom-3 right-3 bg-card/90 backdrop-blur border border-border rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-1"
          >
            Open heatmap <ArrowUpRight className="h-3 w-3" />
          </Link>
          <div className="absolute top-3 left-3 bg-card/90 backdrop-blur border border-border rounded-full px-3 py-1.5 text-[11px] font-medium flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-safe animate-pulse-soft" /> Live • Bengaluru
          </div>
        </div>
      )}

      {/* Live alerts preview */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Live nearby alerts</h2>
        <Link to="/alerts" className="text-xs text-primary">See all</Link>
      </div>
      <div className="mt-2 space-y-2">
        {LIVE_ALERTS.slice(0, 2).map((a) => {
          const tone = a.level === "risky" ? "danger" : a.level === "moderate" ? "warning" : "safe";
          return (
            <div key={a.id} className="rounded-2xl p-3 bg-card border border-border flex gap-3">
              <div className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center bg-${tone}/15`}>
                <Bell className={`h-4 w-4 text-${tone}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight truncate">{a.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{a.area} • {a.distanceKm} km</p>
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {a.time}
              </div>
            </div>
          );
        })}
      </div>

      {/* SOS shortcut */}
      <Link to="/sos" className="mt-6 block animate-fade-in-up">
        <div className="rounded-3xl p-4 gradient-danger flex items-center gap-3 glow-danger hover-lift">
          <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center animate-sos-halo">
            <Phone className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Emergency SOS</p>
            <p className="text-[11px] text-white/85">Hold 3 sec to alert your contacts & share live location</p>
          </div>
          <ArrowUpRight className="h-5 w-5 text-white" />
        </div>
      </Link>

      <BottomNav />

      <LandmarkSearchSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onPick={(p) => {
          setLastDestination({
            cityId: p.cityId,
            name: p.landmark.name,
            area: p.landmark.area,
            coords: p.landmark.coords,
          });
          setSearchOpen(false);
          navigate({ to: "/heatmap" });
        }}
      />
    </PhoneShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "safe" | "warning" | "danger" }) {
  return (
    <div className="rounded-xl bg-background/60 border border-border p-2.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-xs font-semibold mt-0.5 text-${tone}`}>{value}</p>
    </div>
  );
}
