import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Sliders, Database, Sun, Moon, Play, Pause, Sparkles,
  RotateCcw, Activity, MapPin, Clock, ShieldAlert,
} from "lucide-react";
import { PhoneShell } from "@/components/yatra/PhoneShell";
import { BottomNav } from "@/components/yatra/BottomNav";
import {
  useReports, credibility, REASON_META, relativeTime,
} from "@/lib/reports-store";
import {
  useWeights, setWeights, resetWeights, DEFAULT_WEIGHTS,
  useTimeMode, setTimeMode, effectiveHour, isNightMode,
  useSimRunning, startSim, stopSim,
  injectDummyBatch, spawnRandomEvent, useSimEvents,
  type SafetyWeights,
} from "@/lib/admin-store";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — YatraGuard" }] }),
  component: AdminPage,
});

const WEIGHT_FIELDS: { key: keyof SafetyWeights; label: string; hint: string; tone: "safe" | "danger" }[] = [
  { key: "lighting",       label: "Lighting boost",      hint: "Lit roads safer", tone: "safe" },
  { key: "crowd",          label: "Crowd boost",         hint: "Footfall = safer", tone: "safe" },
  { key: "cctv",           label: "CCTV boost",          hint: "Camera coverage", tone: "safe" },
  { key: "patrol",         label: "Patrol boost",        hint: "Recent police", tone: "safe" },
  { key: "crimePenalty",   label: "Crime penalty",       hint: "Historic crime", tone: "danger" },
  { key: "reportPenalty",  label: "User-report penalty", hint: "Community flags", tone: "danger" },
  { key: "nightPenalty",   label: "Night-time penalty",  hint: "After 8pm dim", tone: "danger" },
];

function AdminPage() {
  const reports = useReports();
  const weights = useWeights();
  const timeMode = useTimeMode();
  const simOn = useSimRunning();
  const events = useSimEvents();
  // Defer time-derived UI to after mount to avoid SSR hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const sorted = useMemo(
    () => [...reports].sort((a, b) => credibility(b).score - credibility(a).score).slice(0, 8),
    [reports],
  );

  const night = mounted ? isNightMode() : false;
  const hour = mounted ? effectiveHour() : 13;

  return (
    <PhoneShell>
      <div className="flex items-center gap-3 mb-4">
        <Link to="/profile" className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold leading-tight">Admin console</h1>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3 text-safe animate-pulse-soft" />
            Demo controls · {reports.length} active reports
          </p>
        </div>
      </div>

      {/* Live status */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <StatCard label="Reports" value={reports.length} tone="info" />
        <StatCard label="Sim events" value={events.length} tone="safe" />
        <StatCard label={night ? "Night" : "Day"} value={`${hour}:00`} tone={night ? "danger" : "warning"} />
      </div>

      {/* Time of day */}
      <Section icon={night ? Moon : Sun} title="Time-of-day simulation" hint="Override how the safety engine sees the clock.">
        <div className="grid grid-cols-3 gap-2">
          {(["auto", "day", "night"] as const).map((m) => {
            const active = timeMode === m;
            return (
              <button
                key={m}
                onClick={() => setTimeMode(m)}
                className={`h-10 rounded-xl text-xs font-semibold capitalize border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                {m === "auto" ? "Auto" : m === "day" ? "☀ Day" : "🌙 Night"}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Dummy data injectors */}
      <Section icon={Database} title="Inject demo data" hint="Fire reports across Bengaluru, Hyderabad and Delhi.">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => spawnRandomEvent()}
            className="h-11 rounded-xl bg-card border border-border text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-safe" /> Spawn one
          </button>
          <button
            onClick={() => injectDummyBatch(8)}
            className="h-11 rounded-xl gradient-safe text-safe-foreground text-xs font-semibold flex items-center justify-center gap-1.5 glow-safe"
          >
            <Database className="h-3.5 w-3.5" /> Inject batch ×8
          </button>
        </div>
        <button
          onClick={() => (simOn ? stopSim() : startSim(6000))}
          className={`mt-2 h-11 w-full rounded-xl text-xs font-semibold flex items-center justify-center gap-2 ${
            simOn ? "gradient-danger text-white" : "bg-card border border-border"
          }`}
        >
          {simOn ? <><Pause className="h-4 w-4" /> Stop live simulator</> : <><Play className="h-4 w-4" /> Start live simulator (6s)</>}
        </button>
      </Section>

      {/* Weights */}
      <Section
        icon={Sliders}
        title="Safety weights"
        hint="Tune how the score engine balances signals."
        action={
          <button
            onClick={resetWeights}
            className="text-[11px] text-muted-foreground flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        }
      >
        <div className="space-y-3">
          {WEIGHT_FIELDS.map((f) => (
            <WeightSlider
              key={f.key}
              label={f.label}
              hint={f.hint}
              value={weights[f.key]}
              tone={f.tone}
              onChange={(v) => setWeights({ [f.key]: v } as Partial<SafetyWeights>)}
              defaultValue={DEFAULT_WEIGHTS[f.key]}
            />
          ))}
        </div>
      </Section>

      {/* Reported incidents */}
      <Section icon={ShieldAlert} title="Reported incidents" hint="Top community reports by credibility.">
        {sorted.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">
            No active reports. Inject some demo data above.
          </div>
        )}
        <div className="space-y-2">
          {sorted.map((r) => {
            const meta = REASON_META[r.reason];
            const cred = credibility(r);
            const tone = cred.level === "high" ? "danger" : cred.level === "medium" ? "warning" : "info";
            return (
              <div key={r.id} className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-background border border-border flex items-center justify-center text-base">
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-tight truncate">{meta.label}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-2.5 w-2.5" /> {r.area}
                    <Clock className="h-2.5 w-2.5 ml-1" /> {relativeTime(r.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-${tone}/15 text-${tone} font-bold uppercase`}>
                    {cred.score}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {r.confirmations}↑ {r.disputes}↓
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Sim event log */}
      {events.length > 0 && (
        <Section icon={Activity} title="Simulator log" hint="Latest auto-generated events.">
          <div className="rounded-xl bg-card border border-border divide-y divide-border max-h-56 overflow-y-auto">
            {events.slice(0, 12).map((e) => {
              const meta = REASON_META[e.reason];
              return (
                <div key={e.id} className="px-3 py-2 flex items-center gap-2 text-[11px]">
                  <span className="text-base">{meta.emoji}</span>
                  <span className="font-semibold">{meta.label}</span>
                  <span className="text-muted-foreground truncate">· {e.area}, {e.city}</span>
                  <span className="ml-auto text-muted-foreground">{relativeTime(e.at)}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <BottomNav />
    </PhoneShell>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold mt-0.5 text-${tone}`}>{value}</p>
    </div>
  );
}

function Section({
  icon: Icon, title, hint, action, children,
}: {
  icon: any; title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold">{title}</p>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function WeightSlider({
  label, hint, value, onChange, tone, defaultValue,
}: {
  label: string; hint: string; value: number; onChange: (n: number) => void;
  tone: "safe" | "danger"; defaultValue: number;
}) {
  const max = 60;
  const pct = Math.min(100, (value / max) * 100);
  const barColor = tone === "safe" ? "bg-safe" : "bg-danger";
  return (
    <div className="rounded-xl bg-card border border-border p-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-xs font-semibold leading-tight">{label}</p>
          <p className="text-[10px] text-muted-foreground">{hint}</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold text-${tone}`}>{value}</p>
          <p className="text-[10px] text-muted-foreground">def {defaultValue}</p>
        </div>
      </div>
      <div className="relative h-1.5 rounded-full bg-background/60 overflow-hidden mb-2">
        <div className={`absolute left-0 top-0 bottom-0 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <input
        type="range" min={0} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}