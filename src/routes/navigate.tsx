import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Shield, Lightbulb, Users, Camera, AlertTriangle, Navigation,
  Sun, Moon, ChevronDown, ChevronUp, Activity, Zap, ShieldCheck,
} from "lucide-react";
import { PhoneShell } from "@/components/yatra/PhoneShell";
import { BottomNav } from "@/components/yatra/BottomNav";
import { SafetyMap } from "@/components/yatra/SafetyMap";
import { HOME, SUGGESTED_DESTINATION, HEAT_ZONES } from "@/lib/mock-data";
import { ROUTE_SPECS } from "@/lib/route-segments";
import { rankRoutes, scoreRoute, scoreSegment, isNight, type Strategy } from "@/lib/safety-engine";
import { track } from "@/lib/analytics-store";

export const Route = createFileRoute("/navigate")({
  head: () => ({ meta: [{ title: "Pick a route — YatraGuard" }] }),
  component: NavigatePage,
});

const STRAT_LABEL: Record<Strategy, { title: string; sub: string; tone: "safe" | "warning" | "danger" }> = {
  safest: { title: "Safest", sub: "Maximize safety score", tone: "safe" },
  balanced: { title: "Balanced", sub: "60% safety + 40% speed", tone: "warning" },
  fastest: { title: "Fastest", sub: "Minimize travel time", tone: "danger" },
};

function NavigatePage() {
  const [strategy, setStrategy] = useState<Strategy>("safest");
  // Avoid SSR/client mismatch: start with a deterministic hour, sync on mount.
  const [hour, setHour] = useState(13);
  const [selected, setSelected] = useState("r1");
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => { setHour(new Date().getHours()); }, []);

  const night = isNight(hour);

  type ScoredWithSpec = ReturnType<typeof scoreRoute> & { spec: typeof ROUTE_SPECS[number] };
  const scored = useMemo<ScoredWithSpec[]>(
    () => ROUTE_SPECS.map((r) => ({ ...scoreRoute(r.id, r.segments, hour), spec: r })),
    [hour]
  );
  const ranked = useMemo(
    () => rankRoutes(scored, strategy) as ScoredWithSpec[],
    [scored, strategy]
  );
  const recommended = ranked[0];

  // Auto-select recommended when strategy / time changes
  useEffect(() => { setSelected(recommended.id); }, [recommended.id]);

  const route = scored.find((r) => r.id === selected)!;
  const spec = route.spec;
  const segBreakdowns = spec.segments.map((s) => ({ s, b: scoreSegment(s, hour) }));

  // Map polylines: color each by computed tier so the engine output is visible on the map.
  const mapRoutes = scored.map((r) => ({
    id: r.id,
    label: r.spec.label,
    kind: r.tier === "safe" ? "safest" : r.tier === "moderate" ? "balanced" : "fastest",
    safetyScore: r.safetyScore,
    durationMin: r.totalMin,
    distanceKm: r.totalKm,
    litPercent: r.litPercent,
    crowdLevel: "medium" as const,
    cctvCount: r.cctvCount,
    policeNearby: r.patrolCount,
    warnings: r.spec.warnings,
    highlights: r.spec.highlights,
    path: r.spec.path,
  }));

  return (
    <PhoneShell noPad>
      <div className="relative h-[44vh] min-h-[300px]">
        <SafetyMap
          center={[12.9750, 77.6420]}
          zoom={15}
          routes={mapRoutes as any}
          selectedRouteId={selected}
          heatZones={HEAT_ZONES.slice(0, 4)}
          origin={HOME.coords}
          destination={SUGGESTED_DESTINATION.coords}
        />

        <div className="absolute top-4 left-4 right-4 flex gap-2">
          <Link to="/" className="h-10 w-10 rounded-xl bg-card/90 backdrop-blur border border-border flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 rounded-xl bg-card/90 backdrop-blur border border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-info" />
              <p className="text-xs text-muted-foreground truncate">{HOME.name} • {HOME.area}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-2 w-2 rounded-full bg-safe" />
              <p className="text-xs font-medium truncate">{SUGGESTED_DESTINATION.name}</p>
            </div>
          </div>
        </div>

        {/* Time-of-day simulator */}
        <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-card/90 backdrop-blur border border-border p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {night ? <Moon className="h-3.5 w-3.5 text-info" /> : <Sun className="h-3.5 w-3.5 text-warning" />}
              Simulated time: <span className="text-foreground">{String(hour).padStart(2, "0")}:00</span>
              <span className={`text-[10px] uppercase font-bold ${night ? "text-info" : "text-warning"}`}>
                {night ? "Night" : "Day"}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">scores recompute live</span>
          </div>
          <input
            type="range" min={0} max={23} value={hour}
            onChange={(e) => setHour(+e.target.value)}
            className="w-full accent-[var(--safe)]"
          />
        </div>
      </div>

      <div className="-mt-6 relative z-10 rounded-t-3xl bg-card border-t border-border px-5 pt-4 pb-28">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-muted" />

        {/* Strategy selector */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Routing strategy</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-safe/15 text-safe font-semibold flex items-center gap-1">
              <Activity className="h-3 w-3" /> Engine v1
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-background/60 border border-border">
            {(Object.keys(STRAT_LABEL) as Strategy[]).map((k) => {
              const meta = STRAT_LABEL[k];
              const active = strategy === k;
              const Icon = k === "safest" ? ShieldCheck : k === "balanced" ? Shield : Zap;
              return (
                <button
                  key={k}
                  onClick={() => {
                    setStrategy(k);
                    track(k === "fastest" ? "route_fastest_chosen" : "route_safer_chosen", { strategy: k });
                  }}
                  className={`rounded-xl py-2 text-center transition-all ${
                    active ? `bg-${meta.tone}/15 text-${meta.tone}` : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 mx-auto" />
                  <p className="text-[11px] font-semibold mt-0.5">{meta.title}</p>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">{STRAT_LABEL[strategy].sub}</p>
        </div>

        {/* Route options ranked by engine */}
        <div className="mt-4 space-y-2.5">
          {ranked.map((r, idx) => {
            const active = r.id === selected;
            const tone = r.tier === "safe" ? "safe" : r.tier === "moderate" ? "warning" : "danger";
            const isPick = idx === 0;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`w-full text-left rounded-2xl p-3.5 border transition-all ${
                  active
                    ? `bg-${tone}/10 border-${tone}/50 ${tone === "safe" ? "glow-safe" : ""}`
                    : "bg-background/40 border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`h-9 w-9 rounded-xl bg-${tone}/20 flex items-center justify-center shrink-0`}>
                      <Shield className={`h-4 w-4 text-${tone}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{r.spec.label}</p>
                        {isPick && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-${tone} text-${tone}-foreground font-bold uppercase`}>
                            Pick
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{r.totalKm} km • {r.totalMin} min</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-2xl font-bold text-${tone} leading-none`}>{r.safetyScore}<span className="text-xs text-muted-foreground font-medium">%</span></p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">safety</p>
                  </div>
                </div>

                {/* Safety bar */}
                <div className="mt-2.5 h-1.5 rounded-full bg-background/80 overflow-hidden flex">
                  {r.segments.map((s) => {
                    const sb = scoreSegment(s, hour);
                    const t = sb.tier;
                    const w = (s.lengthKm / r.totalKm) * 100;
                    return (
                      <div
                        key={s.id}
                        title={`${s.name} • ${sb.score}`}
                        style={{ width: `${w}%` }}
                        className={`h-full bg-${t === "safe" ? "safe" : t === "moderate" ? "warning" : "danger"}`}
                      />
                    );
                  })}
                </div>

                {active && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <Mini icon={Lightbulb} label={`${r.litPercent}%`} sub="lit" />
                    <Mini icon={Users} label={r.reportCount === 0 ? "clean" : `${r.reportCount}`} sub="reports" />
                    <Mini icon={Camera} label={String(r.cctvCount)} sub="CCTV" />
                    <Mini icon={Shield} label={String(r.patrolCount)} sub="patrol" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Why this score */}
        <button
          onClick={() => setShowWhy((s) => !s)}
          className="mt-3 w-full rounded-2xl bg-background/40 border border-border px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold">Why score {route.safetyScore}? Per-segment breakdown</p>
          </div>
          {showWhy ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showWhy && (
          <div className="mt-2 rounded-2xl border border-border bg-background/40 divide-y divide-border overflow-hidden">
            {segBreakdowns.map(({ s, b }) => {
              const tone = b.tier === "safe" ? "safe" : b.tier === "moderate" ? "warning" : "danger";
              return (
                <div key={s.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.lengthKm} km • {s.baseMinutes} min</p>
                    </div>
                    <div className={`text-lg font-bold text-${tone} leading-none`}>{b.score}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                    {b.contributors.map((c) => {
                      const positive = c.impact >= 0;
                      return (
                        <div key={c.label} className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">{c.label}</span>
                          <span className={positive ? "text-safe font-semibold" : "text-danger font-semibold"}>
                            {positive ? "+" : ""}{c.impact.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {spec.warnings.length > 0 && (
          <div className="mt-3 rounded-2xl p-3 bg-danger/10 border border-danger/30 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-danger">Heads up on this route</p>
              <ul className="text-[11px] text-muted-foreground mt-0.5 space-y-0.5">
                {spec.warnings.map((w) => <li key={w}>• {w}</li>)}
              </ul>
              <p className="text-[10px] text-muted-foreground mt-1">
                Weakest segment: <span className="text-danger font-semibold">{route.weakest.segment.name}</span> ({route.weakest.score}/100)
              </p>
            </div>
          </div>
        )}

        <button className="mt-4 w-full rounded-2xl gradient-safe text-safe-foreground py-3.5 font-semibold flex items-center justify-center gap-2 glow-safe">
          <Navigation className="h-4 w-4" />
          Start guided trip • {route.totalMin} min
        </button>
      </div>

      <BottomNav />
    </PhoneShell>
  );
}

function Mini({ icon: Icon, label, sub }: { icon: any; label: string; sub: string }) {
  return (
    <div className="rounded-xl bg-background/60 border border-border p-2 text-center">
      <Icon className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
      <p className="text-xs font-semibold mt-1 capitalize">{label}</p>
      <p className="text-[9px] text-muted-foreground uppercase">{sub}</p>
    </div>
  );
}
