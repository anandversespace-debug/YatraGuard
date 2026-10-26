// Crowd-powered alert reports — in-memory + localStorage with expiry & credibility.
import { useEffect, useState } from "react";
import type { LatLng, SafetyTier } from "./mock-data";

export type ReportReason =
  | "harassment"
  | "dark_road"
  | "theft_risk"
  | "stalking"
  | "accident"
  | "crowd";

export const REASON_META: Record<
  ReportReason,
  { label: string; emoji: string; severity: number; tier: SafetyTier }
> = {
  harassment: { label: "Harassment", emoji: "🚫", severity: 5, tier: "risky" },
  stalking:   { label: "Being followed", emoji: "👤", severity: 5, tier: "risky" },
  theft_risk: { label: "Theft risk", emoji: "💰", severity: 4, tier: "risky" },
  dark_road:  { label: "Dark road", emoji: "🌑", severity: 3, tier: "moderate" },
  accident:   { label: "Accident", emoji: "⚠️", severity: 3, tier: "moderate" },
  crowd:      { label: "Unsafe crowd", emoji: "👥", severity: 2, tier: "moderate" },
};

export interface CrowdReport {
  id: string;
  reason: ReportReason;
  note?: string;
  coords: LatLng;
  area: string;
  createdAt: number;     // ms
  expiresAt: number;     // ms
  confirmations: number; // upvotes (incl. reporter = 1)
  disputes: number;
}

const KEY = "yg.reports.v1";
const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const CLUSTER_RADIUS_M = 120;               // merge nearby same-reason reports

type Listener = (r: CrowdReport[]) => void;
const listeners = new Set<Listener>();
let cache: CrowdReport[] | null = null;

function read(): CrowdReport[] {
  if (cache) return cache;
  if (typeof window === "undefined") return (cache = seed());
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return (cache = seed());
    const list = JSON.parse(raw) as CrowdReport[];
    cache = list.filter((r) => r.expiresAt > Date.now());
    return cache;
  } catch {
    return (cache = seed());
  }
}

function write(list: CrowdReport[]) {
  cache = list;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(list));
  }
  listeners.forEach((l) => l(list));
}

function seed(): CrowdReport[] {
  const now = Date.now();
  return [
    mkSeed("Koramangala 4th Block", [12.9352, 77.6245], "dark_road", 6, 35),
    mkSeed("HSR Sector 2 lane",     [12.9116, 77.6446], "harassment", 9, 12),
    mkSeed("KR Market lanes",       [12.9634, 77.5755], "theft_risk", 4, 50),
    mkSeed("Cubbon Park edge",      [12.9763, 77.5929], "crowd",       3, 22),
  ].map((r) => ({ ...r, createdAt: now - r.createdAt, expiresAt: now + r.expiresAt }));

  function mkSeed(area: string, coords: LatLng, reason: ReportReason, confirmations: number, ageMin: number) {
    return {
      id: `seed-${reason}-${area}`,
      reason, coords, area,
      confirmations, disputes: 0,
      createdAt: ageMin * 60_000,        // converted above
      expiresAt: DEFAULT_TTL_MS - ageMin * 60_000,
    } as CrowdReport;
  }
}

function distMeters(a: LatLng, b: LatLng) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function listReports(): CrowdReport[] {
  return read().filter((r) => r.expiresAt > Date.now());
}

export function subscribe(l: Listener) {
  listeners.add(l);
  l(listReports());
  return () => { listeners.delete(l); };
}

export function addReport(input: {
  reason: ReportReason;
  coords: LatLng;
  area: string;
  note?: string;
}): CrowdReport {
  const list = read();
  // Merge if a same-reason report exists nearby → boost confirmations
  const existing = list.find(
    (r) => r.reason === input.reason && distMeters(r.coords, input.coords) <= CLUSTER_RADIUS_M
  );
  let updated: CrowdReport[];
  let result: CrowdReport;
  const now = Date.now();
  if (existing) {
    result = {
      ...existing,
      confirmations: existing.confirmations + 1,
      expiresAt: Math.max(existing.expiresAt, now + DEFAULT_TTL_MS),
      note: input.note ?? existing.note,
    };
    updated = list.map((r) => (r.id === existing.id ? result : r));
  } else {
    result = {
      id: `r-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      reason: input.reason,
      note: input.note,
      coords: input.coords,
      area: input.area,
      createdAt: now,
      expiresAt: now + DEFAULT_TTL_MS,
      confirmations: 1,
      disputes: 0,
    };
    updated = [result, ...list];
  }
  write(updated);
  return result;
}

export function confirmReport(id: string) {
  const now = Date.now();
  const list = read().map((r) =>
    r.id === id
      ? { ...r, confirmations: r.confirmations + 1, expiresAt: Math.max(r.expiresAt, now + 30 * 60_000) }
      : r,
  );
  write(list);
}

export function disputeReport(id: string) {
  const list = read()
    .map((r) => (r.id === id ? { ...r, disputes: r.disputes + 1 } : r))
    .filter((r) => r.disputes < Math.max(3, r.confirmations)); // auto-remove if disputes win
  write(list);
}

export function purgeExpired() {
  const now = Date.now();
  const list = read().filter((r) => r.expiresAt > now);
  write(list);
}

// ---- Trust / credibility ----
export type Credibility = "low" | "medium" | "high";

export function credibility(r: CrowdReport): { score: number; level: Credibility } {
  // 0–100. Weighted by confirmations - disputes, with severity boost & freshness.
  const sev = REASON_META[r.reason].severity; // 2..5
  const ageMin = (Date.now() - r.createdAt) / 60_000;
  const fresh = Math.max(0.3, 1 - ageMin / 120); // decays over 2h
  const net = Math.max(0, r.confirmations - r.disputes);
  const raw = (net * 14 + sev * 8) * fresh;
  const score = Math.min(100, Math.round(raw));
  const level: Credibility = score >= 65 ? "high" : score >= 35 ? "medium" : "low";
  return { score, level };
}

export function relativeTime(ms: number) {
  const diff = Math.max(0, Date.now() - ms);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function expiresIn(ms: number) {
  const diff = Math.max(0, ms - Date.now());
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m left`;
  return `${Math.floor(m / 60)}h ${m % 60}m left`;
}

// React hook
export function useReports() {
  const [reports, setReports] = useState<CrowdReport[]>(() => listReports());
  useEffect(() => {
    const unsub = subscribe(setReports);
    const t = window.setInterval(() => {
      purgeExpired();
      setReports(listReports());
    }, 30_000);
    return () => { unsub(); window.clearInterval(t); };
  }, []);
  return reports;
}