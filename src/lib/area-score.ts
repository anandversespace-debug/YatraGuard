import type { LatLng, HeatZone } from "./mock-data";

// Haversine distance (km)
function dist(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

const TIER_BASE = { safe: 88, moderate: 62, risky: 34 } as const;

export interface AreaScore {
  score: number;       // 1–100
  tier: "safe" | "moderate" | "risky";
  closest?: HeatZone;
  closestKm: number;
  influences: { zone: HeatZone; weight: number; km: number }[];
  reason: string;
  factors: { label: string; value: string; tone: "safe" | "warning" | "danger" | "muted" }[];
}

/**
 * Score any tapped point on the map by interpolating from nearby zones.
 * Uses an inverse-distance weighting on nearby zones (within 3 km).
 */
export function scoreArea(point: LatLng, zones: HeatZone[], hour = new Date().getHours()): AreaScore {
  const night = hour >= 20 || hour < 6;
  const enriched = zones
    .map((z) => ({ zone: z, km: dist(point, z.coords) }))
    .sort((a, b) => a.km - b.km);

  const within = enriched.filter((e) => e.km < 3);
  const pool = (within.length ? within : enriched.slice(0, 3));

  let totalW = 0, weighted = 0;
  const influences = pool.map(({ zone, km }) => {
    const w = 1 / Math.pow(km + 0.15, 1.6);
    totalW += w;
    weighted += w * TIER_BASE[zone.level];
    return { zone, weight: w, km };
  });

  let raw = totalW > 0 ? weighted / totalW : 65;
  if (night) raw -= 8;          // night penalty
  raw = Math.max(1, Math.min(100, Math.round(raw)));
  const tier: AreaScore["tier"] = raw >= 75 ? "safe" : raw >= 55 ? "moderate" : "risky";

  const closest = enriched[0]?.zone;
  const closestKm = enriched[0]?.km ?? 0;

  const reason =
    tier === "safe"
      ? `Surrounded by ${pool.filter((p) => p.zone.level === "safe").length} safe hotspots — high footfall and good lighting nearby.`
      : tier === "moderate"
      ? `Mixed area. ${pool.filter((p) => p.zone.level !== "safe").length} caution zone(s) within 3 km. Stay on main roads.`
      : `Multiple risky zones nearby${closest ? `, especially "${closest.name}"` : ""}. Avoid after dark.`;

  const factors: AreaScore["factors"] = [
    { label: "Closest hotspot", value: closest ? `${closest.name} (${closestKm.toFixed(1)} km)` : "—", tone: "muted" },
    { label: "Hotspots within 3 km", value: `${within.length}`, tone: "muted" },
    { label: "Crime signal", value: tier === "risky" ? "Elevated" : tier === "moderate" ? "Moderate" : "Low", tone: tier === "risky" ? "danger" : tier === "moderate" ? "warning" : "safe" },
    { label: "Time-of-day", value: night ? "Night (−8)" : "Day", tone: night ? "warning" : "safe" },
  ];

  return { score: raw, tier, closest, closestKm, influences, reason, factors };
}
