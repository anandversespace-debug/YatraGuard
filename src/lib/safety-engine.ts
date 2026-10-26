// YatraGuard — Safety Score Engine
// Pure, deterministic. Each road segment gets a 1–100 safety score from
// weighted inputs: crime, lighting, crowd, user reports, time-of-day.
import { getWeights, effectiveHour } from "./admin-store";

export type Tier = "safe" | "moderate" | "risky";

export interface SegmentInputs {
  id: string;
  name: string;
  // 0 (none) → 100 (severe)
  crimeIndex: number;
  // 0 (pitch dark) → 100 (well-lit)
  lighting: number;
  // 0 (deserted) → 100 (busy footfall)
  crowdDensity: number;
  // count of "unsafe" community flags in last 30 days
  userReports: number;
  // count of CCTV cameras on the segment
  cctv: number;
  // 1 if patrol seen recently, else 0
  recentPatrol: number;
  // length of segment in km, used for route weighting
  lengthKm: number;
  // base travel time in minutes
  baseMinutes: number;
}

export interface ScoreBreakdown {
  score: number;          // 1–100
  tier: Tier;
  contributors: {
    label: string;
    impact: number;       // -100 … +100, signed contribution
    reason: string;
  }[];
}

// Weights are read live from the admin store so the demo console can tune them.
const BASELINE = 30;

const clamp = (n: number, lo = 1, hi = 100) => Math.max(lo, Math.min(hi, n));

export function isNight(hour: number) {
  return hour >= 20 || hour < 6;
}

/**
 * Score a single road segment.
 * Logic:
 *   - High crime + low light → very low score.
 *   - High crowd + daytime → boosted score.
 *   - User unsafe reports → linear penalty.
 *   - CCTV + recent patrol → small positive boost.
 */
export function scoreSegment(s: SegmentInputs, hour = effectiveHour()): ScoreBreakdown {
  const night = isNight(hour);
  const W = getWeights();

  const lightingPts = (s.lighting / 100) * W.lighting;
  // Crowd helps a LOT in daytime, helps less at night (crowd ≠ safety after midnight)
  const crowdPts = (s.crowdDensity / 100) * W.crowd * (night ? 0.6 : 1);
  const cctvPts = Math.min(1, s.cctv / 8) * W.cctv;
  const patrolPts = s.recentPatrol * W.patrol;

  // Crime penalty — scaled up at night when lighting is poor
  const lightFactor = 1 - s.lighting / 100; // 1 = pitch dark
  const crimePenalty = (s.crimeIndex / 100) * W.crimePenalty * (1 + lightFactor * 0.5);

  const reportPenalty = Math.min(1, s.userReports / 15) * W.reportPenalty;
  const nightPenalty = night ? W.nightPenalty * (1 - s.lighting / 100) : 0;

  const raw =
    BASELINE + lightingPts + crowdPts + cctvPts + patrolPts -
    crimePenalty - reportPenalty - nightPenalty;

  const score = Math.round(clamp(raw));
  const tier: Tier = score >= 75 ? "safe" : score >= 55 ? "moderate" : "risky";

  return {
    score,
    tier,
    contributors: [
      { label: "Lighting", impact: +lightingPts, reason: `${s.lighting}% lit${night ? " (night)" : ""}` },
      { label: "Crowd", impact: +crowdPts, reason: `${s.crowdDensity}% footfall` },
      { label: "CCTV coverage", impact: +cctvPts, reason: `${s.cctv} cameras` },
      { label: "Recent patrol", impact: +patrolPts, reason: s.recentPatrol ? "Seen <15 min ago" : "None reported" },
      { label: "Crime index", impact: -crimePenalty, reason: `${s.crimeIndex}/100 area history` },
      { label: "Unsafe reports", impact: -reportPenalty, reason: `${s.userReports} community flags` },
      ...(night ? [{ label: "Night-time", impact: -nightPenalty, reason: "After 8pm + dim stretch" }] : []),
    ],
  };
}

// ---------- Route scoring ----------

export interface ScoredRoute {
  id: string;
  segments: SegmentInputs[];
  // length-weighted average safety
  safetyScore: number;
  tier: Tier;
  // weakest link on the route (lowest segment score)
  weakest: { segment: SegmentInputs; score: number };
  totalKm: number;
  totalMin: number;
  litPercent: number;
  cctvCount: number;
  patrolCount: number;
  reportCount: number;
}

export function scoreRoute(id: string, segments: SegmentInputs[], hour?: number): ScoredRoute {
  const totalKm = segments.reduce((a, s) => a + s.lengthKm, 0);
  const totalMin = segments.reduce((a, s) => a + s.baseMinutes, 0);
  const cctvCount = segments.reduce((a, s) => a + s.cctv, 0);
  const patrolCount = segments.reduce((a, s) => a + s.recentPatrol, 0);
  const reportCount = segments.reduce((a, s) => a + s.userReports, 0);
  const litPercent = Math.round(
    segments.reduce((a, s) => a + (s.lighting * s.lengthKm), 0) / Math.max(0.001, totalKm)
  );

  const scored = segments.map((s) => ({ s, b: scoreSegment(s, hour) }));
  const safetyScore = Math.round(
    scored.reduce((a, x) => a + x.b.score * x.s.lengthKm, 0) / Math.max(0.001, totalKm)
  );
  const weakest = scored.reduce((min, x) => (x.b.score < min.b.score ? x : min), scored[0]);
  const tier: Tier = safetyScore >= 75 ? "safe" : safetyScore >= 55 ? "moderate" : "risky";

  return {
    id,
    segments,
    safetyScore,
    tier,
    weakest: { segment: weakest.s, score: weakest.b.score },
    totalKm: Math.round(totalKm * 10) / 10,
    totalMin: Math.round(totalMin),
    litPercent,
    cctvCount,
    patrolCount,
    reportCount,
  };
}

/**
 * Pick the optimal route given a strategy.
 *  - safest: maximize safetyScore (penalize time slightly)
 *  - balanced: weight safety 60% + speed 40%
 *  - fastest: minimize time
 */
export type Strategy = "safest" | "balanced" | "fastest";

export function rankRoutes(routes: ScoredRoute[], strategy: Strategy): ScoredRoute[] {
  const minTime = Math.min(...routes.map((r) => r.totalMin));
  const maxTime = Math.max(...routes.map((r) => r.totalMin));
  const span = Math.max(1, maxTime - minTime);

  const scoreFor = (r: ScoredRoute) => {
    const speed = 100 - ((r.totalMin - minTime) / span) * 100;
    if (strategy === "safest") return r.safetyScore * 0.9 + speed * 0.1;
    if (strategy === "fastest") return speed * 0.85 + r.safetyScore * 0.15;
    return r.safetyScore * 0.6 + speed * 0.4;
  };
  return [...routes].sort((a, b) => scoreFor(b) - scoreFor(a));
}
