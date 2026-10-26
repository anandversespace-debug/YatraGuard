// YatraGuard mock data — Bengaluru-centered, but represents any Indian city.
export type LatLng = [number, number];

export type SafetyTier = "safe" | "moderate" | "risky";

export interface Place {
  id: string;
  name: string;
  area: string;
  coords: LatLng;
}

export interface RouteOption {
  id: string;
  label: string;
  kind: "safest" | "balanced" | "fastest";
  safetyScore: number; // 0-100
  durationMin: number;
  distanceKm: number;
  litPercent: number;
  crowdLevel: "high" | "medium" | "low";
  cctvCount: number;
  policeNearby: number;
  warnings: string[];
  highlights: string[];
  path: LatLng[];
}

export interface RiskAlert {
  id: string;
  title: string;
  detail: string;
  area: string;
  distanceKm: number;
  level: SafetyTier;
  time: string;
  source: "Community" | "Police feed" | "AI signal" | "News";
  coords: LatLng;
}

export interface HeatZone {
  id: string;
  name: string;
  coords: LatLng;
  radius: number; // meters
  level: SafetyTier;
  reports: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export const CITY_CENTER: LatLng = [12.9716, 77.5946];

export const HOME: Place = {
  id: "home",
  name: "Home",
  area: "Indiranagar, Bengaluru",
  coords: [12.9719, 77.6412],
};

export const RECENT_PLACES: Place[] = [
  { id: "p1", name: "PES University", area: "Banashankari", coords: [12.9352, 77.5354] },
  { id: "p2", name: "Forum Mall", area: "Koramangala", coords: [12.9344, 77.6101] },
  { id: "p3", name: "Cubbon Park Metro", area: "MG Road", coords: [12.9762, 77.5993] },
  { id: "p4", name: "Manyata Tech Park", area: "Hebbal", coords: [13.0438, 77.6210] },
];

export const SUGGESTED_DESTINATION: Place = {
  id: "dest",
  name: "Indiranagar Metro",
  area: "100 Ft Road",
  coords: [12.9784, 77.6408],
};

// Three route alternatives between two points (illustrative paths).
export const ROUTES: RouteOption[] = [
  {
    id: "r1",
    label: "Safest route",
    kind: "safest",
    safetyScore: 92,
    durationMin: 18,
    distanceKm: 5.4,
    litPercent: 96,
    crowdLevel: "high",
    cctvCount: 24,
    policeNearby: 3,
    warnings: [],
    highlights: ["Well-lit main roads", "Police patrol every 12 min", "Active footfall"],
    path: [
      [12.9719, 77.6412],
      [12.9742, 77.6398],
      [12.9760, 77.6402],
      [12.9774, 77.6405],
      [12.9784, 77.6408],
    ],
  },
  {
    id: "r2",
    label: "Balanced",
    kind: "balanced",
    safetyScore: 74,
    durationMin: 14,
    distanceKm: 4.6,
    litPercent: 78,
    crowdLevel: "medium",
    cctvCount: 11,
    policeNearby: 1,
    warnings: ["1 dim stretch near park"],
    highlights: ["Shorter time", "Decent lighting"],
    path: [
      [12.9719, 77.6412],
      [12.9735, 77.6430],
      [12.9755, 77.6440],
      [12.9775, 77.6425],
      [12.9784, 77.6408],
    ],
  },
  {
    id: "r3",
    label: "Fastest route",
    kind: "fastest",
    safetyScore: 48,
    durationMin: 11,
    distanceKm: 4.1,
    litPercent: 52,
    crowdLevel: "low",
    cctvCount: 3,
    policeNearby: 0,
    warnings: ["Low lighting", "Recent incident reported", "Sparse footfall after 9pm"],
    highlights: ["Shortest distance"],
    path: [
      [12.9719, 77.6412],
      [12.9710, 77.6440],
      [12.9740, 77.6460],
      [12.9778, 77.6440],
      [12.9784, 77.6408],
    ],
  },
];

export const LIVE_ALERTS: RiskAlert[] = [
  {
    id: "a1",
    title: "Crowd dispersing rapidly",
    detail: "AI signal detected unusual crowd movement near 80 Ft Road junction.",
    area: "Koramangala 4th Block",
    distanceKm: 1.2,
    level: "risky",
    time: "2 min ago",
    source: "AI signal",
    coords: [12.9352, 77.6245],
  },
  {
    id: "a2",
    title: "Street lights out",
    detail: "12 community reports of outage along inner lane.",
    area: "HSR Layout Sector 2",
    distanceKm: 2.4,
    level: "moderate",
    time: "11 min ago",
    source: "Community",
    coords: [12.9116, 77.6446],
  },
  {
    id: "a3",
    title: "Police patrol active",
    detail: "Patrol vehicle spotted — area marked safer.",
    area: "MG Road",
    distanceKm: 3.1,
    level: "safe",
    time: "18 min ago",
    source: "Police feed",
    coords: [12.9756, 77.6068],
  },
  {
    id: "a4",
    title: "Traffic chokepoint",
    detail: "Heavy slow-moving traffic, increased pickpocket risk.",
    area: "Silk Board",
    distanceKm: 5.8,
    level: "moderate",
    time: "26 min ago",
    source: "News",
    coords: [12.9176, 77.6228],
  },
];

export const HEAT_ZONES: HeatZone[] = [
  { id: "h1", name: "MG Road", coords: [12.9756, 77.6068], radius: 600, level: "safe", reports: 142 },
  { id: "h2", name: "Indiranagar 100ft", coords: [12.9784, 77.6408], radius: 550, level: "safe", reports: 98 },
  { id: "h3", name: "Cubbon Park (after 9pm)", coords: [12.9763, 77.5929], radius: 700, level: "moderate", reports: 41 },
  { id: "h4", name: "KR Market lanes", coords: [12.9634, 77.5755], radius: 500, level: "risky", reports: 67 },
  { id: "h5", name: "Yeshwanthpur underpass", coords: [13.0287, 77.5400], radius: 450, level: "risky", reports: 53 },
  { id: "h6", name: "Koramangala 4th Block", coords: [12.9352, 77.6245], radius: 500, level: "moderate", reports: 38 },
  { id: "h7", name: "HSR Sector 2", coords: [12.9116, 77.6446], radius: 480, level: "moderate", reports: 29 },
  { id: "h8", name: "Hebbal flyover edge", coords: [13.0438, 77.6210], radius: 520, level: "risky", reports: 44 },
  { id: "h9", name: "Jayanagar 4th Block", coords: [12.9250, 77.5938], radius: 600, level: "safe", reports: 110 },
];

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: "c1", name: "Mom", relation: "Family", phone: "+91 98xxx 12345" },
  { id: "c2", name: "Aarav", relation: "Roommate", phone: "+91 99xxx 88210" },
  { id: "c3", name: "Riya", relation: "Best friend", phone: "+91 90xxx 55621" },
];

export const QUICK_DIAL = [
  { id: "q1", label: "Police", number: "100", tone: "danger" as const },
  { id: "q2", label: "Women Helpline", number: "1091", tone: "safe" as const },
  { id: "q3", label: "Ambulance", number: "108", tone: "warning" as const },
];

export const SAFETY_TIPS = [
  "Share your live trip with a trusted contact before leaving.",
  "Prefer well-lit roads even if 2–3 minutes longer.",
  "Avoid earphones in unfamiliar lanes after dark.",
  "Walk facing traffic so vehicles can't approach unseen.",
];
