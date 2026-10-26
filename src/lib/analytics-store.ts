// Lightweight client-side analytics for YatraGuard demo.
// Tracks user behavior signals + a 1000-user simulated cohort
// so the metrics dashboard always feels alive.
import { useEffect, useState } from "react";

export type AnalyticsEvent =
  | "route_safer_chosen"
  | "route_fastest_chosen"
  | "sos_triggered"
  | "report_submitted"
  | "alert_viewed"
  | "session_started";

export interface AnalyticsRecord {
  id: string;
  event: AnalyticsEvent;
  at: number;        // ms
  userId: string;    // anon
  city?: string;
  meta?: Record<string, string | number>;
}

const KEY = "yg.analytics.v1";
const SIM_KEY = "yg.analytics.sim.v1";
const MAX_RECORDS = 5000;

type Listener = (records: AnalyticsRecord[]) => void;
const listeners = new Set<Listener>();
let cache: AnalyticsRecord[] | null = null;

function read(): AnalyticsRecord[] {
  if (cache) return cache;
  if (typeof window === "undefined") return (cache = []);
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as AnalyticsRecord[]) : [];
  } catch {
    cache = [];
  }
  // Auto-seed simulation on first read in browser.
  if (cache.length === 0 && !localStorage.getItem(SIM_KEY)) {
    cache = simulateCohort(1000);
    localStorage.setItem(SIM_KEY, "1");
    write(cache);
  }
  return cache;
}

function write(list: AnalyticsRecord[]) {
  cache = list.slice(-MAX_RECORDS);
  if (typeof window !== "undefined") {
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* quota */ }
  }
  listeners.forEach((l) => l(cache!));
}

export function track(event: AnalyticsEvent, meta?: AnalyticsRecord["meta"]) {
  const list = read();
  const rec: AnalyticsRecord = {
    id: `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    event,
    at: Date.now(),
    userId: getOrCreateUserId(),
    meta,
  };
  write([...list, rec]);
}

function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "ssr";
  const k = "yg.uid";
  let id = localStorage.getItem(k);
  if (!id) {
    id = `u-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(k, id);
  }
  return id;
}

export function subscribe(l: Listener) {
  listeners.add(l);
  l(read());
  return () => { listeners.delete(l); };
}

export function clearAnalytics() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SIM_KEY);
  }
  cache = [];
  listeners.forEach((l) => l([]));
}

export function reseedSimulation(n = 1000) {
  const sim = simulateCohort(n);
  write(sim);
  if (typeof window !== "undefined") localStorage.setItem(SIM_KEY, "1");
}

// ---- Cohort simulation ----
const SIM_CITIES = ["Bengaluru", "Delhi", "Mumbai", "Hyderabad", "Pune", "Jaipur", "Lucknow", "Indore", "Kochi", "Chandigarh"];

function simulateCohort(users: number): AnalyticsRecord[] {
  const now = Date.now();
  const out: AnalyticsRecord[] = [];
  const DAY = 24 * 60 * 60 * 1000;
  for (let i = 0; i < users; i++) {
    const userId = `sim-${i.toString(36)}`;
    const city = SIM_CITIES[i % SIM_CITIES.length];
    // Spread sessions over the last 14 days
    const sessions = 1 + Math.floor(Math.random() * 4);
    for (let s = 0; s < sessions; s++) {
      const at = now - Math.random() * 14 * DAY;
      out.push(rec("session_started", at, userId, city));
      // Route choice: 72% safer vs 28% fastest (our value prop)
      if (Math.random() < 0.85) {
        out.push(rec(Math.random() < 0.72 ? "route_safer_chosen" : "route_fastest_chosen",
          at + 60_000, userId, city));
      }
      // Alerts viewed often
      if (Math.random() < 0.55) out.push(rec("alert_viewed", at + 90_000, userId, city));
      // Reports: ~12% of sessions submit one
      if (Math.random() < 0.12) {
        out.push(rec("report_submitted", at + 120_000, userId, city, {
          reason: pick(["harassment", "dark_road", "theft_risk", "stalking", "accident", "crowd"]),
        }));
      }
      // SOS: ~1.4% of sessions (rare but critical)
      if (Math.random() < 0.014) {
        out.push(rec("sos_triggered", at + 180_000, userId, city));
      }
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

function rec(event: AnalyticsEvent, at: number, userId: string, city: string, meta?: AnalyticsRecord["meta"]): AnalyticsRecord {
  return {
    id: `s-${at.toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    event, at, userId, city, meta,
  };
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ---- Aggregations ----
export interface Metrics {
  totalUsers: number;
  totalSessions: number;
  routeSaferCount: number;
  routeFastestCount: number;
  saferShare: number;       // 0..1
  sosCount: number;
  sosRatePct: number;       // SOS per 100 sessions
  reportsCount: number;
  reportsPerUser: number;
  alertsViewed: number;
  byCity: { city: string; users: number; reports: number; sos: number; saferShare: number }[];
  daily: { day: string; sessions: number; safer: number; fastest: number; reports: number; sos: number }[];
  reasons: { reason: string; count: number }[];
}

export function aggregate(records: AnalyticsRecord[]): Metrics {
  const users = new Set<string>();
  let sessions = 0, safer = 0, fastest = 0, sos = 0, reports = 0, alerts = 0;
  const cityMap = new Map<string, { users: Set<string>; reports: number; sos: number; safer: number; fastest: number }>();
  const dayMap = new Map<string, { sessions: number; safer: number; fastest: number; reports: number; sos: number }>();
  const reasonMap = new Map<string, number>();

  for (const r of records) {
    users.add(r.userId);
    const day = new Date(r.at).toISOString().slice(0, 10);
    if (!dayMap.has(day)) dayMap.set(day, { sessions: 0, safer: 0, fastest: 0, reports: 0, sos: 0 });
    const dRow = dayMap.get(day)!;
    const c = r.city ?? "Unknown";
    if (!cityMap.has(c)) cityMap.set(c, { users: new Set(), reports: 0, sos: 0, safer: 0, fastest: 0 });
    const cRow = cityMap.get(c)!;
    cRow.users.add(r.userId);

    switch (r.event) {
      case "session_started":      sessions++; dRow.sessions++; break;
      case "route_safer_chosen":   safer++;    dRow.safer++;    cRow.safer++; break;
      case "route_fastest_chosen": fastest++;  dRow.fastest++;  cRow.fastest++; break;
      case "sos_triggered":        sos++;      dRow.sos++;      cRow.sos++; break;
      case "report_submitted":
        reports++; dRow.reports++; cRow.reports++;
        if (r.meta?.reason) {
          const k = String(r.meta.reason);
          reasonMap.set(k, (reasonMap.get(k) ?? 0) + 1);
        }
        break;
      case "alert_viewed":         alerts++; break;
    }
  }

  const totalRouteChoices = safer + fastest;
  const byCity = [...cityMap.entries()]
    .map(([city, v]) => ({
      city,
      users: v.users.size,
      reports: v.reports,
      sos: v.sos,
      saferShare: v.safer + v.fastest > 0 ? v.safer / (v.safer + v.fastest) : 0,
    }))
    .sort((a, b) => b.users - a.users);

  const daily = [...dayMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-14)
    .map(([day, v]) => ({ day, ...v }));

  const reasons = [...reasonMap.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalUsers: users.size,
    totalSessions: sessions,
    routeSaferCount: safer,
    routeFastestCount: fastest,
    saferShare: totalRouteChoices > 0 ? safer / totalRouteChoices : 0,
    sosCount: sos,
    sosRatePct: sessions > 0 ? (sos / sessions) * 100 : 0,
    reportsCount: reports,
    reportsPerUser: users.size > 0 ? reports / users.size : 0,
    alertsViewed: alerts,
    byCity,
    daily,
    reasons,
  };
}

export function useAnalytics() {
  const [records, setRecords] = useState<AnalyticsRecord[]>(() => read());
  useEffect(() => subscribe(setRecords), []);
  return records;
}