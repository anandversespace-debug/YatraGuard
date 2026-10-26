// YatraGuard — Admin demo controls
// Adjustable safety weights, time-of-day override, and a random-event simulator.
import { useEffect, useState } from "react";
import { CITIES } from "./cities";
import { addReport, type ReportReason } from "./reports-store";

// ---------- Weights ----------
export interface SafetyWeights {
  lighting: number;
  crowd: number;
  cctv: number;
  patrol: number;
  crimePenalty: number;
  reportPenalty: number;
  nightPenalty: number;
}

export const DEFAULT_WEIGHTS: SafetyWeights = {
  lighting: 25,
  crowd: 20,
  cctv: 15,
  patrol: 10,
  crimePenalty: 35,
  reportPenalty: 25,
  nightPenalty: 15,
};

const W_KEY = "yg.weights.v1";
const T_KEY = "yg.timeMode.v1";

type WListener = (w: SafetyWeights) => void;
const wListeners = new Set<WListener>();
let wCache: SafetyWeights | null = null;

function readWeights(): SafetyWeights {
  if (wCache) return wCache;
  if (typeof window === "undefined") return (wCache = { ...DEFAULT_WEIGHTS });
  try {
    const raw = localStorage.getItem(W_KEY);
    wCache = raw ? { ...DEFAULT_WEIGHTS, ...JSON.parse(raw) } : { ...DEFAULT_WEIGHTS };
  } catch {
    wCache = { ...DEFAULT_WEIGHTS };
  }
  return wCache!;
}

export function getWeights() { return readWeights(); }

export function setWeights(next: Partial<SafetyWeights>) {
  const merged = { ...readWeights(), ...next };
  wCache = merged;
  if (typeof window !== "undefined") localStorage.setItem(W_KEY, JSON.stringify(merged));
  wListeners.forEach((l) => l(merged));
}

export function resetWeights() {
  wCache = { ...DEFAULT_WEIGHTS };
  if (typeof window !== "undefined") localStorage.removeItem(W_KEY);
  wListeners.forEach((l) => l(wCache!));
}

export function useWeights() {
  const [w, setW] = useState<SafetyWeights>(() => readWeights());
  useEffect(() => {
    const l: WListener = (next) => setW(next);
    wListeners.add(l);
    return () => { wListeners.delete(l); };
  }, []);
  return w;
}

// ---------- Time-of-day override ----------
export type TimeMode = "auto" | "day" | "night";

type TListener = (m: TimeMode) => void;
const tListeners = new Set<TListener>();
let tCache: TimeMode | null = null;

function readTimeMode(): TimeMode {
  if (tCache) return tCache;
  if (typeof window === "undefined") return (tCache = "auto");
  tCache = ((localStorage.getItem(T_KEY) as TimeMode) || "auto");
  return tCache;
}

export function getTimeMode() { return readTimeMode(); }

export function setTimeMode(m: TimeMode) {
  tCache = m;
  if (typeof window !== "undefined") localStorage.setItem(T_KEY, m);
  tListeners.forEach((l) => l(m));
}

export function effectiveHour(now = new Date()) {
  const m = readTimeMode();
  if (m === "day") return 13;
  if (m === "night") return 22;
  return now.getHours();
}

export function isNightMode() {
  const h = effectiveHour();
  return h >= 20 || h < 6;
}

export function useTimeMode() {
  const [m, setM] = useState<TimeMode>(() => readTimeMode());
  useEffect(() => {
    const l: TListener = (next) => setM(next);
    tListeners.add(l);
    return () => { tListeners.delete(l); };
  }, []);
  return m;
}

// ---------- Random event simulator ----------
const REASONS: ReportReason[] = ["harassment", "stalking", "theft_risk", "dark_road", "accident", "crowd"];
const NIGHT_REASONS: ReportReason[] = ["harassment", "stalking", "dark_road", "theft_risk"];

const NOTES: Record<ReportReason, string[]> = {
  harassment: ["Group catcalling pedestrians", "Aggressive behaviour outside shop"],
  stalking:   ["Person following solo walkers", "Vehicle trailing slowly"],
  theft_risk: ["Phone snatching reported", "Bag-grab on two-wheeler"],
  dark_road:  ["Several street lights out", "Pitch dark stretch near corner"],
  accident:   ["Two-wheeler skid, road slippery", "Minor collision blocking lane"],
  crowd:      ["Sudden crowd build-up", "Unsafe push at junction"],
};

function jitter(coord: number, amount = 0.006) {
  return coord + (Math.random() - 0.5) * amount * 2;
}

export interface SimEvent {
  id: string;
  city: string;
  reason: ReportReason;
  area: string;
  at: number;
}

const eventLog: SimEvent[] = [];
const eListeners = new Set<(e: SimEvent[]) => void>();

export function listSimEvents() { return eventLog; }
export function subscribeSim(l: (e: SimEvent[]) => void) {
  eListeners.add(l); l(eventLog);
  return () => { eListeners.delete(l); };
}

export function spawnRandomEvent(): SimEvent {
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const zone = city.zones[Math.floor(Math.random() * city.zones.length)];
  const pool = isNightMode() ? NIGHT_REASONS : REASONS;
  const reason = pool[Math.floor(Math.random() * pool.length)];
  const note = NOTES[reason][Math.floor(Math.random() * NOTES[reason].length)];
  addReport({
    reason,
    coords: [jitter(zone.coords[0]), jitter(zone.coords[1])],
    area: `${zone.name}, ${city.short}`,
    note,
  });
  const ev: SimEvent = {
    id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    city: city.name,
    reason,
    area: zone.name,
    at: Date.now(),
  };
  eventLog.unshift(ev);
  if (eventLog.length > 50) eventLog.length = 50;
  eListeners.forEach((l) => l(eventLog));
  return ev;
}

export function injectDummyBatch(n = 8) {
  for (let i = 0; i < n; i++) spawnRandomEvent();
}

let simTimer: number | null = null;
const SIM_KEY = "yg.sim.on.v1";

export function isSimRunning() {
  return simTimer !== null;
}

export function startSim(intervalMs = 6000) {
  if (simTimer !== null || typeof window === "undefined") return;
  simTimer = window.setInterval(spawnRandomEvent, intervalMs);
  localStorage.setItem(SIM_KEY, "1");
  simListeners.forEach((l) => l(true));
}

export function stopSim() {
  if (simTimer !== null && typeof window !== "undefined") {
    window.clearInterval(simTimer);
  }
  simTimer = null;
  if (typeof window !== "undefined") localStorage.removeItem(SIM_KEY);
  simListeners.forEach((l) => l(false));
}

const simListeners = new Set<(on: boolean) => void>();
export function useSimRunning() {
  const [on, setOn] = useState<boolean>(() => isSimRunning());
  useEffect(() => {
    const l = (next: boolean) => setOn(next);
    simListeners.add(l);
    return () => { simListeners.delete(l); };
  }, []);
  return on;
}

export function useSimEvents() {
  const [list, setList] = useState<SimEvent[]>(() => [...eventLog]);
  useEffect(() => subscribeSim((e) => setList([...e])), []);
  return list;
}