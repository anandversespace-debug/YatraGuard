import type { LatLng } from "./mock-data";

const KEY = "yg.lastDest.v1";

export interface SelectedDestination {
  cityId: string;
  name: string;
  area: string;
  coords: LatLng;
}

export function setLastDestination(d: SelectedDestination) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* noop */ }
}

export function getLastDestination(): SelectedDestination | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SelectedDestination) : null;
  } catch { return null; }
}

export function clearLastDestination() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}