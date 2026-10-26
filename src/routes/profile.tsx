import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, Bell, MapPin, Moon, Users, ChevronRight, Sparkles, Sliders, Wifi, WifiOff, BarChart3 } from "lucide-react";
import { PhoneShell } from "@/components/yatra/PhoneShell";
import { BottomNav } from "@/components/yatra/BottomNav";
import { SAFETY_TIPS, EMERGENCY_CONTACTS } from "@/lib/mock-data";
import { useLite } from "@/lib/lite-mode";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "You — YatraGuard" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [lite, setLite] = useLite();
  return (
    <PhoneShell>
      <div className="flex items-center gap-3 mb-5">
        <Link to="/" className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-semibold">Your safety profile</h1>
      </div>

      <div className="rounded-3xl p-5 bg-card border border-border flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl gradient-safe flex items-center justify-center text-safe-foreground text-xl font-bold glow-safe">A</div>
        <div className="flex-1">
          <p className="text-base font-semibold">Aanya Sharma</p>
          <p className="text-xs text-muted-foreground">Indiranagar, Bengaluru</p>
          <div className="flex gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-safe/15 text-safe font-semibold">Verified</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-info/15 text-info font-semibold">42 trips logged</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="Avg trip safety" value="84" tone="safe" />
        <Stat label="Reports filed" value="12" tone="info" />
      </div>

      <p className="mt-6 text-xs font-semibold mb-2">Settings</p>
      <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
        <Row icon={Shield} label="Always pick safest route" hint="Adds up to 5 min" toggle defaultOn />
        <Row icon={Bell} label="Push live alerts" hint="Within 3 km" toggle defaultOn />
        <Row icon={MapPin} label="Auto-share trip with circle" toggle defaultOn />
        <Row icon={Moon} label="Night mode boost" hint="Tighter alerts after 8pm" toggle />
        <Row icon={Users} label="Trusted contacts" hint={`${EMERGENCY_CONTACTS.length} added`} />
        <LiteRow on={lite} onToggle={() => setLite(!lite)} />
      </div>

      <Link
        to="/admin"
        className="mt-4 flex items-center gap-3 rounded-2xl p-4 bg-card border border-border"
      >
        <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Sliders className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">Admin console</p>
          <p className="text-[11px] text-muted-foreground">Demo controls, weights & event simulator</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <Link
        to="/metrics"
        className="mt-2 flex items-center gap-3 rounded-2xl p-4 bg-card border border-border"
      >
        <div className="h-9 w-9 rounded-xl bg-info/15 flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-info" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">Traction metrics</p>
          <p className="text-[11px] text-muted-foreground">Route choice, SOS rate, reports — 1k user sim</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <p className="mt-6 text-xs font-semibold mb-2 flex items-center gap-1">
        <Sparkles className="h-3.5 w-3.5 text-safe" /> Daily safety tips
      </p>
      <div className="space-y-2">
        {SAFETY_TIPS.map((t, i) => (
          <div key={i} className="rounded-2xl p-3 bg-card border border-border text-xs leading-relaxed text-muted-foreground">
            <span className="text-safe font-semibold mr-2">0{i + 1}</span> {t}
          </div>
        ))}
      </div>

      <BottomNav />
    </PhoneShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl p-4 bg-card border border-border">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 text-${tone}`}>{value}</p>
    </div>
  );
}

function Row({ icon: Icon, label, hint, toggle, defaultOn }: { icon: any; label: string; hint?: string; toggle?: boolean; defaultOn?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="h-9 w-9 rounded-xl bg-background/60 border border-border flex items-center justify-center">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {toggle ? (
        <div className={`h-6 w-10 rounded-full p-0.5 transition-colors ${defaultOn ? "bg-safe" : "bg-muted"}`}>
          <div className={`h-5 w-5 rounded-full bg-white transition-transform ${defaultOn ? "translate-x-4" : ""}`} />
        </div>
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

function LiteRow({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const Icon = on ? WifiOff : Wifi;
  return (
    <button onClick={onToggle} className="w-full text-left flex items-center gap-3 px-4 py-3.5">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${on ? "bg-info/15 text-info" : "bg-background/60 border border-border text-muted-foreground"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">Lite mode {on && <span className="text-[10px] text-info ml-1">ON</span>}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Skip map tiles, animations & heavy visuals — built for 2G/3G & budget phones</p>
      </div>
      <div className={`h-6 w-10 rounded-full p-0.5 transition-colors ${on ? "bg-info" : "bg-muted"}`}>
        <div className={`h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
      </div>
    </button>
  );
}
