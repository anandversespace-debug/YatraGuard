// YatraGuard — Lite Mode (low-internet, budget-Android friendly).
// When ON we:
//   - Skip OSM map tiles (saves ~80% of network on map screens)
//   - Render a lightweight schematic map (SVG) instead
//   - Disable pulse + animation effects (less GPU/CPU on cheap phones)
//   - Default to landmark-search instead of free-text address
import { useEffect, useState } from "react";

const KEY = "yg.lite.v1";
type Listener = (on: boolean) => void;
const listeners = new Set<Listener>();
let cache: boolean | null = null;

function read(): boolean {
  if (cache !== null) return cache;
  if (typeof window === "undefined") return (cache = false);
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "1") return (cache = true);
    if (raw === "0") return (cache = false);
    // Auto-detect on first load: enable on slow connections / low memory devices.
    const conn = (navigator as any).connection;
    const slow = conn && (conn.saveData === true ||
      ["slow-2g", "2g", "3g"].includes(conn.effectiveType));
    const lowMem = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 2;
    cache = Boolean(slow || lowMem);
  } catch {
    cache = false;
  }
  return cache!;
}

export function isLite() { return read(); }

export function setLite(on: boolean) {
  cache = on;
  if (typeof window !== "undefined") localStorage.setItem(KEY, on ? "1" : "0");
  listeners.forEach((l) => l(on));
}

export function toggleLite() { setLite(!read()); }

export function useLite(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState<boolean>(() => read());
  useEffect(() => {
    const l: Listener = (next) => setOn(next);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return [on, setLite];
}