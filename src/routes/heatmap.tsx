import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Layers, Locate, Eye, EyeOff, X, Shield, MapPin, Sparkles, Plus, Flag, Search, WifiOff } from "lucide-react";
import { PhoneShell } from "@/components/yatra/PhoneShell";
import { BottomNav } from "@/components/yatra/BottomNav";
import { SafetyMap } from "@/components/yatra/SafetyMap";
import { ReportSheet } from "@/components/yatra/ReportSheet";
import { useReports } from "@/lib/reports-store";
import { CITIES } from "@/lib/cities";
import { scoreArea } from "@/lib/area-score";
import type { LatLng } from "@/lib/mock-data";
import { LandmarkSearchSheet } from "@/components/yatra/LandmarkSearchSheet";
import { getLastDestination, clearLastDestination } from "@/lib/destination-store";
import { useLite } from "@/lib/lite-mode";

export const Route = createFileRoute("/heatmap")({
  head: () => ({ meta: [{ title: "Safety heatmap — YatraGuard" }] }),
  component: HeatmapPage,
});

function HeatmapPage() {
  const [cityId, setCityId] = useState<string>("blr");
  const [showHeat, setShowHeat] = useState(true);
  const [tap, setTap] = useState<LatLng | null>(null);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const reports = useReports();
  const [lite] = useLite();

  // Honor any landmark picked from Home / search.
  useEffect(() => {
    const d = getLastDestination();
    if (!d) return;
    setCityId(d.cityId);
    setCenter([d.coords[0], d.coords[1]]);
    setTap([d.coords[0], d.coords[1]]);
    clearLastDestination();
  }, []);

  const city = CITIES.find((c) => c.id === cityId) ?? CITIES[0];
  const mapCenter = center ?? city.center;

  const totals = useMemo(
    () => city.zones.reduce(
      (acc, z) => ({ ...acc, [z.level]: (acc as any)[z.level] + 1 }),
      { safe: 0, moderate: 0, risky: 0 } as any
    ),
    [city]
  );

  const tapScore = tap ? scoreArea(tap, city.zones) : null;

  const switchCity = (id: string) => {
    setCityId(id);
    setCenter(null);
    setTap(null);
  };

  return (
    <PhoneShell noPad>
      <div className="relative h-[78vh] min-h-[460px]">
        <SafetyMap
          center={mapCenter}
          zoom={12}
          heatZones={city.zones}
          alerts={city.alerts}
          reports={reports}
          user={city.user}
          showHeatmap={showHeat}
          onMapTap={(c) => setTap(c)}
          highlight={tap}
        />

        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 flex gap-2">
          <Link to="/" className="h-10 w-10 rounded-xl bg-card/90 backdrop-blur border border-border flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex-1 text-left rounded-xl bg-card/90 backdrop-blur border border-border px-3 py-2 flex items-center gap-2"
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-safe animate-pulse-soft" />
                Search landmark in {city.name}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{city.zones.length} zones • {city.tier === 2 ? "Tier-2" : "Tier-1"}</p>
            </div>
            {lite && <WifiOff className="h-3.5 w-3.5 text-info" />}
          </button>
          <div className="hidden">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-safe animate-pulse-soft" />
              {city.name} • Safety heatmap
            </p>
            <p className="text-[11px] text-muted-foreground">{city.zones.length} zones • tap any area for score</p>
          </div>
        </div>

        {/* City switcher (scrolls — Tier-2 cities) */}
        <div className="absolute top-20 left-4 right-4 flex gap-1.5 overflow-x-auto pb-1 -mr-2 pr-4 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {CITIES.map((c) => (
            <button
              key={c.id}
              onClick={() => switchCity(c.id)}
              className={`shrink-0 min-w-[72px] rounded-xl py-1.5 px-2 text-[11px] font-semibold border backdrop-blur transition-all ${
                cityId === c.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/80 text-muted-foreground border-border"
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                {c.short}
                {c.tier === 2 && (
                  <span className={`text-[8px] px-1 rounded ${cityId === c.id ? "bg-primary-foreground/20" : "bg-info/20 text-info"}`}>T2</span>
                )}
              </span>
              <span className="block text-[9px] font-normal opacity-80 truncate">{c.name}</span>
            </button>
          ))}
        </div>

        {/* Right control stack */}
        <div className="absolute top-36 right-4 flex flex-col gap-2">
          <button
            onClick={() => setShowHeat((s) => !s)}
            className={`h-10 w-10 rounded-xl border backdrop-blur flex items-center justify-center ${
              showHeat ? "bg-safe/15 border-safe/40 text-safe" : "bg-card/90 border-border text-muted-foreground"
            }`}
            title="Toggle heatmap"
          >
            {showHeat ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            onClick={() => { setCenter([city.user[0], city.user[1]]); }}
            className="h-10 w-10 rounded-xl bg-card/90 backdrop-blur border border-border flex items-center justify-center text-info"
            title="My location"
          >
            <Locate className="h-4 w-4" />
          </button>
          <button
            onClick={() => setReportOpen(true)}
            className="h-10 w-10 rounded-xl gradient-danger text-white flex items-center justify-center shadow-elevated"
            title="Report unsafe area"
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 rounded-xl bg-card/90 backdrop-blur border border-border px-3 py-2 text-[10px] space-y-1">
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-safe" /> Safe</div>
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Caution</div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-danger animate-pulse-soft" /> Risky
          </div>
        </div>

        {/* Hint */}
        {!tap && (
          <div className="absolute bottom-4 right-4 rounded-xl bg-card/90 backdrop-blur border border-border px-3 py-2 text-[10px] text-muted-foreground flex items-center gap-1.5 max-w-[55%]">
            <Sparkles className="h-3 w-3 text-safe" />
            Tap anywhere on the map
          </div>
        )}

        {/* Tap result card */}
        {tapScore && tap && (
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-card/95 backdrop-blur border border-border p-4 shadow-elevated animate-fade-in">
            <button
              onClick={() => setTap(null)}
              className="absolute top-3 right-3 h-7 w-7 rounded-lg bg-background/60 border border-border flex items-center justify-center"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-start gap-3">
              <div className={`h-14 w-14 rounded-2xl bg-${toneFor(tapScore.tier)}/15 flex flex-col items-center justify-center shrink-0`}>
                <Shield className={`h-4 w-4 text-${toneFor(tapScore.tier)}`} />
                <p className={`text-sm font-bold text-${toneFor(tapScore.tier)} leading-none mt-0.5`}>{tapScore.score}</p>
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Safety score: <span className={`text-${toneFor(tapScore.tier)}`}>{tapScore.score}/100</span></p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-${toneFor(tapScore.tier)}/15 text-${toneFor(tapScore.tier)} font-bold uppercase`}>
                    {tapScore.tier}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {tap[0].toFixed(4)}, {tap[1].toFixed(4)}
                </p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{tapScore.reason}</p>
                <button
                  onClick={() => setReportOpen(true)}
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-danger"
                >
                  <Plus className="h-3 w-3" /> Report here
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {tapScore.factors.map((f) => (
                <div key={f.label} className="rounded-lg bg-background/50 border border-border px-2.5 py-1.5">
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{f.label}</p>
                  <p className={`text-[11px] font-semibold mt-0.5 text-${f.tone === "muted" ? "foreground" : f.tone}`}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sheet */}
      <div className="-mt-6 relative z-10 rounded-t-3xl bg-card border-t border-border px-5 pt-4 pb-28">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-muted" />
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Layers className="h-3 w-3" /> {city.name}
            </p>
            <h2 className="text-lg font-semibold">Risk legend</h2>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Legend tone="safe" label="Safe" count={totals.safe} />
          <Legend tone="warning" label="Caution" count={totals.moderate} />
          <Legend tone="danger" label="Risky" count={totals.risky} />
        </div>

        <p className="mt-5 text-xs font-semibold mb-2">Hotspots in {city.name}</p>
        <div className="space-y-2">
          {city.zones.map((z) => {
            const tone = toneFor(z.level);
            return (
              <button
                key={z.id}
                onClick={() => { setCenter([z.coords[0], z.coords[1]]); setTap([z.coords[0], z.coords[1]]); }}
                className="w-full text-left rounded-2xl p-3 bg-background/40 border border-border flex items-center gap-3"
              >
                <span className={`h-3 w-3 rounded-full bg-${tone} ${z.level === "risky" ? "animate-pulse-soft" : ""}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{z.name}</p>
                  <p className="text-[11px] text-muted-foreground">{z.reports} community reports</p>
                </div>
                <span className={`text-[10px] uppercase font-semibold text-${tone}`}>{z.level}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        defaultCoords={tap ?? city.user}
        defaultArea={`${city.name} area`}
      />

      <LandmarkSearchSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onPick={(p) => {
          setCityId(p.cityId);
          setCenter([p.landmark.coords[0], p.landmark.coords[1]]);
          setTap([p.landmark.coords[0], p.landmark.coords[1]]);
          setSearchOpen(false);
        }}
      />

      <BottomNav />
    </PhoneShell>
  );
}

function toneFor(t: "safe" | "moderate" | "risky") {
  return t === "safe" ? "safe" : t === "moderate" ? "warning" : "danger";
}

function Legend({ tone, label, count }: { tone: string; label: string; count: number }) {
  return (
    <div className={`rounded-2xl p-3 bg-${tone}/10 border border-${tone}/30`}>
      <p className={`text-2xl font-bold text-${tone}`}>{count}</p>
      <p className="text-[11px] text-muted-foreground">{label} zones</p>
    </div>
  );
}
