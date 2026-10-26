import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft, ShieldCheck, Zap, Siren, Flag, Users, TrendingUp, RefreshCw, Sparkles, MapPin, CalendarRange,
} from "lucide-react";
import { PhoneShell } from "@/components/yatra/PhoneShell";
import { BottomNav } from "@/components/yatra/BottomNav";
import { useAnalytics, aggregate, reseedSimulation, clearAnalytics } from "@/lib/analytics-store";

export const Route = createFileRoute("/metrics")({
  head: () => ({ meta: [{ title: "Traction metrics — YatraGuard" }] }),
  component: MetricsPage,
});

const RANGES = [
  { id: "1d",  label: "24h",  days: 1 },
  { id: "7d",  label: "7d",   days: 7 },
  { id: "14d", label: "14d",  days: 14 },
  { id: "30d", label: "30d",  days: 30 },
  { id: "all", label: "All",  days: 0 },
] as const;
type RangeId = typeof RANGES[number]["id"];

function MetricsPage() {
  const records = useAnalytics();
  const [city, setCity] = useState<string>("all");
  const [range, setRange] = useState<RangeId>("14d");

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) if (r.city) set.add(r.city);
    return [...set].sort();
  }, [records]);

  const filtered = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)!.days;
    const cutoff = days > 0 ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;
    return records.filter((r) => {
      if (city !== "all" && r.city !== city) return false;
      if (cutoff && r.at < cutoff) return false;
      return true;
    });
  }, [records, city, range]);

  const m = useMemo(() => aggregate(filtered), [filtered]);

  return (
    <PhoneShell>
      <div className="flex items-center gap-3 mb-4">
        <Link to="/profile" className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold leading-tight">Traction metrics</h1>
          <p className="text-xs text-muted-foreground">Live + 1,000-user simulated cohort</p>
        </div>
        <button
          onClick={() => reseedSimulation(1000)}
          className="h-9 px-3 rounded-xl bg-primary/15 text-primary border border-primary/30 text-xs font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Re-sim
        </button>
      </div>

      {/* Filters */}
      <div className="mb-3 rounded-2xl p-3 bg-card border border-border space-y-2.5">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> City
          </p>
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
            <Chip active={city === "all"} onClick={() => setCity("all")}>All</Chip>
            {cities.map((c) => (
              <Chip key={c} active={city === c} onClick={() => setCity(c)}>{c}</Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
            <CalendarRange className="h-3 w-3" /> Date range
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`rounded-lg py-1.5 text-[11px] font-semibold transition-all ${
                  range === r.id
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-background/60 text-muted-foreground border border-border"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length.toLocaleString("en-IN")}</span> events
          {city !== "all" && <> in <span className="text-foreground">{city}</span></>}
        </p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 gap-2.5">
        <Kpi
          icon={Users}
          tone="info"
          label="Total users"
          value={m.totalUsers.toLocaleString("en-IN")}
          sub={`${m.totalSessions.toLocaleString("en-IN")} sessions`}
        />
        <Kpi
          icon={ShieldCheck}
          tone="safe"
          label="Chose safer route"
          value={`${Math.round(m.saferShare * 100)}%`}
          sub={`${m.routeSaferCount.toLocaleString("en-IN")} of ${(m.routeSaferCount + m.routeFastestCount).toLocaleString("en-IN")}`}
        />
        <Kpi
          icon={Siren}
          tone="danger"
          label="SOS triggered"
          value={m.sosCount.toLocaleString("en-IN")}
          sub={`${m.sosRatePct.toFixed(2)}% of sessions`}
        />
        <Kpi
          icon={Flag}
          tone="warning"
          label="Unsafe reports"
          value={m.reportsCount.toLocaleString("en-IN")}
          sub={`${m.reportsPerUser.toFixed(2)} / user`}
        />
      </div>

      {/* Safer vs Fastest split */}
      <div className="mt-4 rounded-2xl p-4 bg-card border border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Route preference
          </p>
          <p className="text-[10px] text-muted-foreground">Our value prop</p>
        </div>
        <div className="h-3 w-full rounded-full bg-background overflow-hidden flex">
          <div className="bg-safe h-full" style={{ width: `${m.saferShare * 100}%` }} />
          <div className="bg-danger/70 h-full" style={{ width: `${(1 - m.saferShare) * 100}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-safe" /> Safer {Math.round(m.saferShare * 100)}%</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger/70" /> Fastest {Math.round((1 - m.saferShare) * 100)}%</span>
        </div>
      </div>

      {/* Daily activity bars */}
      <div className="mt-4 rounded-2xl p-4 bg-card border border-border">
        <p className="text-xs font-semibold flex items-center gap-1.5 mb-3">
          <TrendingUp className="h-3.5 w-3.5 text-info" /> Last 14 days
        </p>
        <DailyChart daily={m.daily} />
      </div>

      {/* By city */}
      <div className="mt-4 rounded-2xl p-4 bg-card border border-border">
        <p className="text-xs font-semibold mb-2.5">Top cities</p>
        <div className="space-y-2">
          {m.byCity.slice(0, 6).map((c) => (
            <div key={c.city} className="flex items-center gap-3">
              <div className="w-24 text-xs font-medium truncate">{c.city}</div>
              <div className="flex-1 h-2 rounded-full bg-background overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-info to-primary"
                  style={{ width: `${(c.users / Math.max(1, m.byCity[0].users)) * 100}%` }}
                />
              </div>
              <div className="w-20 text-right text-[11px] tabular-nums">
                <span className="font-semibold">{c.users}</span>
                <span className="text-muted-foreground"> users</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reasons */}
      <div className="mt-4 rounded-2xl p-4 bg-card border border-border">
        <p className="text-xs font-semibold mb-2.5">Top report reasons</p>
        <div className="grid grid-cols-2 gap-2">
          {m.reasons.slice(0, 6).map((r) => (
            <div key={r.reason} className="flex items-center justify-between rounded-xl bg-background/60 border border-border px-3 py-2">
              <span className="text-xs capitalize">{r.reason.replace("_", " ")}</span>
              <span className="text-xs font-bold tabular-nums">{r.count}</span>
            </div>
          ))}
          {m.reasons.length === 0 && (
            <p className="text-[11px] text-muted-foreground col-span-2">No reports yet.</p>
          )}
        </div>
      </div>

      {/* Investor pitch line */}
      <div className="mt-4 rounded-2xl p-4 gradient-safe text-safe-foreground glow-safe">
        <p className="text-[10px] uppercase tracking-widest opacity-90">Why this scales</p>
        <p className="text-sm font-semibold mt-1 leading-snug">
          {Math.round(m.saferShare * 100)}% of riders pick the safer route — proving demand for safety
          over speed. Every report compounds the network and lifts trust city-by-city.
        </p>
      </div>

      <button
        onClick={() => { if (confirm("Clear all analytics?")) clearAnalytics(); }}
        className="mt-4 w-full text-[11px] text-muted-foreground py-2"
      >
        Clear all analytics
      </button>

      <BottomNav />
    </PhoneShell>
  );
}

function Kpi({
  icon: Icon, tone, label, value, sub,
}: {
  icon: typeof Users;
  tone: "safe" | "danger" | "warning" | "info";
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className={`rounded-2xl p-3.5 bg-${tone}/10 border border-${tone}/30`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className={`h-3.5 w-3.5 text-${tone}`} />
      </div>
      <p className="num-display text-2xl font-bold mt-1.5 leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
        active
          ? "bg-primary/20 text-primary border-primary/40"
          : "bg-background/60 text-muted-foreground border-border"
      }`}
    >
      {children}
    </button>
  );
}

function DailyChart({ daily }: { daily: { day: string; sessions: number; safer: number; fastest: number; reports: number; sos: number }[] }) {
  const max = Math.max(1, ...daily.map((d) => d.sessions));
  return (
    <div className="flex items-end gap-1 h-28">
      {daily.map((d) => {
        const h = (d.sessions / max) * 100;
        const saferH = d.sessions > 0 ? (d.safer / Math.max(1, d.safer + d.fastest)) * h : 0;
        const day = d.day.slice(8);
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col-reverse rounded-t-md overflow-hidden bg-background/60 border border-border" style={{ height: `${Math.max(6, h)}%` }}>
              <div className="bg-safe/80" style={{ height: `${saferH}%` }} />
              <div className="bg-danger/60 flex-1" />
            </div>
            <span className="text-[8px] text-muted-foreground tabular-nums">{day}</span>
          </div>
        );
      })}
    </div>
  );
}