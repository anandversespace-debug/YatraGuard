import { useEffect, useMemo, useState } from "react";
import {
  Search, X, MapPin, Train, Bus, Building2, Trees, Hospital, GraduationCap,
  ShoppingBag, Landmark as LandmarkIcon, Sparkles, Navigation as NavIcon,
} from "lucide-react";
import { CITIES, LANDMARKS, type Landmark as BaseLandmark } from "@/lib/cities";
import type { LatLng } from "@/lib/mock-data";

type Landmark = BaseLandmark & { cityId: string };

const KIND_ICON: Record<Landmark["kind"], typeof Search> = {
  metro: Train,
  railway: Train,
  bus_stand: Bus,
  market: ShoppingBag,
  mall: ShoppingBag,
  temple: LandmarkIcon,
  hospital: Hospital,
  college: GraduationCap,
  park: Trees,
  junction: Building2,
};

const KIND_LABEL: Record<Landmark["kind"], string> = {
  metro: "Metro",
  railway: "Railway",
  bus_stand: "Bus stand",
  market: "Market",
  mall: "Mall",
  temple: "Temple",
  hospital: "Hospital",
  college: "College",
  park: "Park",
  junction: "Junction",
};

const RECENT_KEY = "yg.landmark.recent.v1";

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function saveRecent(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, 6)));
}

export interface LandmarkPick {
  landmark: Landmark;
  cityId: string;
  cityName: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (pick: LandmarkPick) => void;
  /** When set, results are pre-filtered to that city. */
  cityId?: string;
}

export function LandmarkSearchSheet({ open, onClose, onPick, cityId }: Props) {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>(() => loadRecent());

  useEffect(() => { if (open) setQ(""); }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    let pool = LANDMARKS;
    if (cityId) pool = pool.filter((l) => l.cityId === cityId);
    if (!term) return pool.slice(0, 24);
    return pool
      .map((l) => {
        const city = CITIES.find((c) => c.id === l.cityId);
        const hay = `${l.name} ${l.area} ${l.hint ?? ""} ${city?.name ?? ""} ${city?.short ?? ""} ${KIND_LABEL[l.kind]}`.toLowerCase();
        // simple substring + token boost
        const score = hay.includes(term) ? 1 : 0;
        return { l, score };
      })
      .filter((x) => x.score > 0)
      .slice(0, 30)
      .map((x) => x.l);
  }, [q, cityId]);

  const recentItems = useMemo(
    () => recent.map((id) => LANDMARKS.find((l) => l.id === id)).filter(Boolean) as Landmark[],
    [recent]
  );

  if (!open) return null;

  const pick = (l: Landmark) => {
    const city = CITIES.find((c) => c.id === l.cityId)!;
    const next = [l.id, ...recent.filter((x) => x !== l.id)].slice(0, 6);
    setRecent(next); saveRecent(next);
    onPick({ landmark: l, cityId: l.cityId, cityName: city.name });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-[420px] sm:rounded-3xl rounded-t-3xl bg-card border border-border shadow-elevated max-h-[88vh] flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-xl bg-background border border-border">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='Try "Charminar", "Sector 17", "Lulu Mall"…'
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground outline-none"
              />
              {q && (
                <button onClick={() => setQ("")} className="text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button onClick={onClose} className="h-11 w-11 rounded-xl bg-background border border-border flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-safe" />
            Search by landmark — no need for exact address
          </p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {!q && recentItems.length > 0 && (
            <Section title="Recent">
              {recentItems.map((l) => <Row key={l.id} l={l} onClick={() => pick(l)} />)}
            </Section>
          )}
          {!q && (
            <Section title="Popular landmarks across India">
              {results.map((l) => <Row key={l.id} l={l} onClick={() => pick(l)} />)}
            </Section>
          )}
          {q && (
            results.length ? (
              <Section title={`${results.length} match${results.length === 1 ? "" : "es"}`}>
                {results.map((l) => <Row key={l.id} l={l} onClick={() => pick(l)} highlight={q} />)}
              </Section>
            ) : (
              <div className="text-center py-12">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium mt-3">No landmark matches "{q}"</p>
                <p className="text-[11px] text-muted-foreground mt-1">Try "metro", "bus stand", "temple" or a city name.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="px-2 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ l, onClick, highlight }: { l: Landmark; onClick: () => void; highlight?: string }) {
  const Icon = KIND_ICON[l.kind] ?? MapPin;
  const city = CITIES.find((c) => c.id === l.cityId);
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-3 bg-background/60 border border-border flex items-center gap-3 active:scale-[0.99] transition-transform"
    >
      <div className="h-10 w-10 rounded-xl bg-info/15 text-info flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight truncate">
          <Mark text={l.name} q={highlight} />
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {KIND_LABEL[l.kind]} • {l.area}
          {city ? <> • <span className="text-foreground/70">{city.short}</span></> : null}
          {l.hint ? <> • {l.hint}</> : null}
        </p>
      </div>
      <NavIcon className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function Mark({ text, q }: { text: string; q?: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-primary font-semibold">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

export type { Landmark };
export type { LatLng };