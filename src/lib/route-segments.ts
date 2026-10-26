// Simulated road-segment dataset for the 3 candidate routes.
// In production this would come from OSM + crime API + community reports.
import type { SegmentInputs } from "./safety-engine";
import type { LatLng } from "./mock-data";

export interface RouteSpec {
  id: string;
  label: string;
  kind: "safest" | "balanced" | "fastest";
  path: LatLng[];
  segments: SegmentInputs[];
  warnings: string[];
  highlights: string[];
}

export const ROUTE_SPECS: RouteSpec[] = [
  {
    id: "r1",
    label: "Main Road via 100ft",
    kind: "safest",
    path: [
      [12.9719, 77.6412],
      [12.9742, 77.6398],
      [12.9760, 77.6402],
      [12.9774, 77.6405],
      [12.9784, 77.6408],
    ],
    warnings: [],
    highlights: ["Well-lit main roads", "Police patrol every 12 min", "Active footfall"],
    segments: [
      { id: "r1-s1", name: "CMH Road", lengthKm: 1.2, baseMinutes: 4, crimeIndex: 12, lighting: 95, crowdDensity: 85, userReports: 0, cctv: 8, recentPatrol: 1 },
      { id: "r1-s2", name: "100 Ft Road", lengthKm: 2.4, baseMinutes: 8, crimeIndex: 18, lighting: 92, crowdDensity: 90, userReports: 1, cctv: 12, recentPatrol: 1 },
      { id: "r1-s3", name: "Metro junction", lengthKm: 1.8, baseMinutes: 6, crimeIndex: 22, lighting: 88, crowdDensity: 80, userReports: 2, cctv: 6, recentPatrol: 1 },
    ],
  },
  {
    id: "r2",
    label: "Mixed via Defence Colony",
    kind: "balanced",
    path: [
      [12.9719, 77.6412],
      [12.9735, 77.6430],
      [12.9755, 77.6440],
      [12.9775, 77.6425],
      [12.9784, 77.6408],
    ],
    warnings: ["1 dim stretch near park (300m)"],
    highlights: ["Shorter time", "Decent lighting", "Some CCTV coverage"],
    segments: [
      { id: "r2-s1", name: "Defence Colony Rd", lengthKm: 1.4, baseMinutes: 4, crimeIndex: 28, lighting: 78, crowdDensity: 60, userReports: 2, cctv: 4, recentPatrol: 0 },
      { id: "r2-s2", name: "Park inner lane", lengthKm: 1.2, baseMinutes: 4, crimeIndex: 42, lighting: 55, crowdDensity: 35, userReports: 4, cctv: 1, recentPatrol: 0 },
      { id: "r2-s3", name: "12th Main", lengthKm: 2.0, baseMinutes: 6, crimeIndex: 25, lighting: 82, crowdDensity: 70, userReports: 1, cctv: 6, recentPatrol: 1 },
    ],
  },
  {
    id: "r3",
    label: "Shortcut via Old Lane",
    kind: "fastest",
    path: [
      [12.9719, 77.6412],
      [12.9710, 77.6440],
      [12.9740, 77.6460],
      [12.9778, 77.6440],
      [12.9784, 77.6408],
    ],
    warnings: ["Low lighting", "Recent incident reported", "Sparse footfall after 9pm"],
    highlights: ["Shortest distance"],
    segments: [
      { id: "r3-s1", name: "Old Madras Lane", lengthKm: 1.0, baseMinutes: 3, crimeIndex: 65, lighting: 35, crowdDensity: 20, userReports: 9, cctv: 0, recentPatrol: 0 },
      { id: "r3-s2", name: "Industrial cut-through", lengthKm: 1.6, baseMinutes: 4, crimeIndex: 58, lighting: 42, crowdDensity: 18, userReports: 6, cctv: 1, recentPatrol: 0 },
      { id: "r3-s3", name: "Back road exit", lengthKm: 1.5, baseMinutes: 4, crimeIndex: 45, lighting: 60, crowdDensity: 40, userReports: 3, cctv: 2, recentPatrol: 0 },
    ],
  },
];
