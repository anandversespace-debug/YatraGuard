import type { LatLng, HeatZone, RiskAlert } from "./mock-data";

export interface CityData {
  id: string;
  name: string;
  short: string;
  tier: 1 | 2;
  center: LatLng;
  user: LatLng; // simulated current location
  zones: HeatZone[];
  alerts: RiskAlert[];
  landmarks?: Landmark[];
}

export interface Landmark {
  id: string;
  /** Common landmark name everyone knows — what users actually say. */
  name: string;
  /** Plain-language area / neighbourhood. */
  area: string;
  /** "Opposite Big Bazaar", "Near temple gate" — landmark-style hint. */
  hint?: string;
  coords: LatLng;
  /** category for icon + filter */
  kind: "metro" | "bus_stand" | "railway" | "market" | "temple" | "mall" | "hospital" | "college" | "park" | "junction";
}

export const CITIES: CityData[] = [
  {
    id: "blr",
    name: "Bengaluru",
    short: "BLR",
    tier: 1,
    center: [12.9716, 77.5946],
    user: [12.9719, 77.6412],
    zones: [
      { id: "b1", name: "MG Road", coords: [12.9756, 77.6068], radius: 600, level: "safe", reports: 142 },
      { id: "b2", name: "Indiranagar 100ft", coords: [12.9784, 77.6408], radius: 550, level: "safe", reports: 98 },
      { id: "b3", name: "Cubbon Park (after 9pm)", coords: [12.9763, 77.5929], radius: 700, level: "moderate", reports: 41 },
      { id: "b4", name: "KR Market lanes", coords: [12.9634, 77.5755], radius: 500, level: "risky", reports: 67 },
      { id: "b5", name: "Yeshwanthpur underpass", coords: [13.0287, 77.5400], radius: 450, level: "risky", reports: 53 },
      { id: "b6", name: "Koramangala 4th Block", coords: [12.9352, 77.6245], radius: 500, level: "moderate", reports: 38 },
      { id: "b7", name: "HSR Sector 2", coords: [12.9116, 77.6446], radius: 480, level: "moderate", reports: 29 },
      { id: "b8", name: "Hebbal flyover edge", coords: [13.0438, 77.6210], radius: 520, level: "risky", reports: 44 },
      { id: "b9", name: "Jayanagar 4th Block", coords: [12.9250, 77.5938], radius: 600, level: "safe", reports: 110 },
    ],
    alerts: [
      { id: "ba1", title: "Crowd dispersing", detail: "AI signal at 80 Ft Road junction.", area: "Koramangala", distanceKm: 1.2, level: "risky", time: "2 min ago", source: "AI signal", coords: [12.9352, 77.6245] },
      { id: "ba2", title: "Street lights out", detail: "12 community reports.", area: "HSR Sector 2", distanceKm: 2.4, level: "moderate", time: "11 min ago", source: "Community", coords: [12.9116, 77.6446] },
      { id: "ba3", title: "Police patrol active", detail: "Patrol vehicle spotted.", area: "MG Road", distanceKm: 3.1, level: "safe", time: "18 min ago", source: "Police feed", coords: [12.9756, 77.6068] },
    ],
  },
  {
    id: "hyd",
    name: "Hyderabad",
    short: "HYD",
    tier: 1,
    center: [17.3850, 78.4867],
    user: [17.4435, 78.3772], // Hitec City
    zones: [
      { id: "h1", name: "Banjara Hills Rd 12", coords: [17.4156, 78.4347], radius: 600, level: "safe", reports: 121 },
      { id: "h2", name: "Hitec City main road", coords: [17.4435, 78.3772], radius: 700, level: "safe", reports: 165 },
      { id: "h3", name: "Charminar lanes (night)", coords: [17.3616, 78.4747], radius: 550, level: "risky", reports: 78 },
      { id: "h4", name: "Secunderabad station back", coords: [17.4399, 78.5021], radius: 500, level: "risky", reports: 62 },
      { id: "h5", name: "Tank Bund", coords: [17.4239, 78.4738], radius: 600, level: "moderate", reports: 47 },
      { id: "h6", name: "Gachibowli IT corridor", coords: [17.4401, 78.3489], radius: 700, level: "safe", reports: 134 },
      { id: "h7", name: "Mehdipatnam crossing", coords: [17.3962, 78.4393], radius: 500, level: "moderate", reports: 36 },
      { id: "h8", name: "LB Nagar bypass", coords: [17.3471, 78.5526], radius: 520, level: "moderate", reports: 31 },
      { id: "h9", name: "Madhapur backlanes", coords: [17.4483, 78.3915], radius: 460, level: "risky", reports: 49 },
    ],
    alerts: [
      { id: "ha1", title: "Suspicious gathering", detail: "AI flagged anomaly near old city.", area: "Charminar", distanceKm: 1.8, level: "risky", time: "4 min ago", source: "AI signal", coords: [17.3616, 78.4747] },
      { id: "ha2", title: "Heavy traffic chokepoint", detail: "Pickpocket risk elevated.", area: "Mehdipatnam", distanceKm: 3.2, level: "moderate", time: "9 min ago", source: "News", coords: [17.3962, 78.4393] },
    ],
  },
  {
    id: "del",
    name: "Delhi NCR",
    short: "DEL",
    tier: 1,
    center: [28.6139, 77.2090],
    user: [28.5450, 77.1926], // Hauz Khas
    zones: [
      { id: "d1", name: "Connaught Place", coords: [28.6315, 77.2167], radius: 700, level: "safe", reports: 188 },
      { id: "d2", name: "Khan Market", coords: [28.5993, 77.2295], radius: 500, level: "safe", reports: 102 },
      { id: "d3", name: "Paharganj backlanes", coords: [28.6450, 77.2120], radius: 550, level: "risky", reports: 84 },
      { id: "d4", name: "Old Delhi alleys (night)", coords: [28.6562, 77.2410], radius: 600, level: "risky", reports: 91 },
      { id: "d5", name: "Hauz Khas Village", coords: [28.5535, 77.1944], radius: 500, level: "moderate", reports: 55 },
      { id: "d6", name: "Saket select walk", coords: [28.5286, 77.2188], radius: 600, level: "safe", reports: 117 },
      { id: "d7", name: "Nizamuddin underpass", coords: [28.5882, 77.2511], radius: 480, level: "risky", reports: 58 },
      { id: "d8", name: "Lajpat Nagar market", coords: [28.5677, 77.2431], radius: 540, level: "moderate", reports: 44 },
      { id: "d9", name: "Cyber Hub Gurgaon", coords: [28.4949, 77.0890], radius: 700, level: "safe", reports: 156 },
      { id: "d10", name: "Noida Sector 18 metro", coords: [28.5707, 77.3260], radius: 600, level: "moderate", reports: 39 },
    ],
    alerts: [
      { id: "da1", title: "Reported snatching", detail: "2 community flags in last hour.", area: "Paharganj", distanceKm: 2.1, level: "risky", time: "6 min ago", source: "Community", coords: [28.6450, 77.2120] },
      { id: "da2", title: "Metro exit crowded", detail: "High footfall, safer.", area: "Saket", distanceKm: 4.0, level: "safe", time: "15 min ago", source: "AI signal", coords: [28.5286, 77.2188] },
    ],
  },
  // ---------- Tier-2 cities ----------
  {
    id: "jai",
    name: "Jaipur",
    short: "JAI",
    tier: 2,
    center: [26.9124, 75.7873],
    user: [26.9196, 75.8200], // near Raja Park
    zones: [
      { id: "j1", name: "MI Road", coords: [26.9166, 75.8090], radius: 600, level: "safe", reports: 88 },
      { id: "j2", name: "C-Scheme", coords: [26.9050, 75.8000], radius: 550, level: "safe", reports: 102 },
      { id: "j3", name: "Chandpole bazaar lanes", coords: [26.9258, 75.8132], radius: 500, level: "moderate", reports: 41 },
      { id: "j4", name: "Sindhi Camp bus stand back", coords: [26.9239, 75.7989], radius: 480, level: "risky", reports: 57 },
      { id: "j5", name: "Galta Ji approach", coords: [26.9234, 75.8513], radius: 520, level: "risky", reports: 33 },
      { id: "j6", name: "Mansarovar main", coords: [26.8540, 75.7656], radius: 600, level: "safe", reports: 74 },
    ],
    alerts: [
      { id: "ja1", title: "Bag-snatch reported", detail: "Two-wheeler grab near bus stand.", area: "Sindhi Camp", distanceKm: 1.6, level: "risky", time: "5 min ago", source: "Community", coords: [26.9239, 75.7989] },
    ],
  },
  {
    id: "lko",
    name: "Lucknow",
    short: "LKO",
    tier: 2,
    center: [26.8467, 80.9462],
    user: [26.8512, 80.9450], // Hazratganj
    zones: [
      { id: "l1", name: "Hazratganj market", coords: [26.8512, 80.9450], radius: 600, level: "safe", reports: 96 },
      { id: "l2", name: "Gomti Nagar Vibhuti Khand", coords: [26.8606, 81.0010], radius: 700, level: "safe", reports: 121 },
      { id: "l3", name: "Aminabad lanes", coords: [26.8487, 80.9337], radius: 500, level: "moderate", reports: 42 },
      { id: "l4", name: "Charbagh station back", coords: [26.8313, 80.9181], radius: 520, level: "risky", reports: 64 },
      { id: "l5", name: "Chowk old city", coords: [26.8729, 80.9128], radius: 480, level: "moderate", reports: 35 },
    ],
    alerts: [
      { id: "la1", title: "Dim stretch", detail: "Lights out near subway.", area: "Charbagh", distanceKm: 2.0, level: "moderate", time: "8 min ago", source: "Community", coords: [26.8313, 80.9181] },
    ],
  },
  {
    id: "ind",
    name: "Indore",
    short: "IND",
    tier: 2,
    center: [22.7196, 75.8577],
    user: [22.7533, 75.8937], // Vijay Nagar
    zones: [
      { id: "i1", name: "Vijay Nagar square", coords: [22.7533, 75.8937], radius: 600, level: "safe", reports: 110 },
      { id: "i2", name: "Rajwada palace area", coords: [22.7177, 75.8545], radius: 500, level: "moderate", reports: 47 },
      { id: "i3", name: "Sarafa bazaar", coords: [22.7195, 75.8580], radius: 450, level: "safe", reports: 132 },
      { id: "i4", name: "Sarwate bus stand back", coords: [22.7110, 75.8675], radius: 500, level: "risky", reports: 58 },
      { id: "i5", name: "Palasia AB Road", coords: [22.7270, 75.8829], radius: 600, level: "safe", reports: 89 },
    ],
    alerts: [
      { id: "ia1", title: "Eve-teasing reported", detail: "Group near bus stand.", area: "Sarwate", distanceKm: 1.9, level: "risky", time: "3 min ago", source: "Community", coords: [22.7110, 75.8675] },
    ],
  },
  {
    id: "kch",
    name: "Kochi",
    short: "KCH",
    tier: 2,
    center: [9.9312, 76.2673],
    user: [10.0150, 76.3416], // Kakkanad
    zones: [
      { id: "k1", name: "MG Road Ernakulam", coords: [9.9764, 76.2820], radius: 600, level: "safe", reports: 98 },
      { id: "k2", name: "Marine Drive", coords: [9.9817, 76.2755], radius: 550, level: "safe", reports: 121 },
      { id: "k3", name: "Mattancherry alleys", coords: [9.9580, 76.2589], radius: 480, level: "moderate", reports: 36 },
      { id: "k4", name: "Vyttila bypass", coords: [9.9670, 76.3180], radius: 500, level: "moderate", reports: 41 },
      { id: "k5", name: "Kakkanad InfoPark", coords: [10.0150, 76.3416], radius: 700, level: "safe", reports: 145 },
    ],
    alerts: [
      { id: "ka1", title: "Heavy rain alert", detail: "Visibility low on bypass.", area: "Vyttila", distanceKm: 2.4, level: "moderate", time: "6 min ago", source: "News", coords: [9.9670, 76.3180] },
    ],
  },
  {
    id: "chd",
    name: "Chandigarh",
    short: "CHD",
    tier: 2,
    center: [30.7333, 76.7794],
    user: [30.7410, 76.7681], // Sec 17
    zones: [
      { id: "c1", name: "Sector 17 plaza", coords: [30.7410, 76.7681], radius: 550, level: "safe", reports: 132 },
      { id: "c2", name: "Sector 22 market", coords: [30.7290, 76.7800], radius: 500, level: "safe", reports: 87 },
      { id: "c3", name: "ISBT-43 back lanes", coords: [30.7106, 76.7729], radius: 480, level: "moderate", reports: 39 },
      { id: "c4", name: "Sukhna Lake (after dark)", coords: [30.7421, 76.8186], radius: 600, level: "moderate", reports: 28 },
      { id: "c5", name: "Industrial Area Phase 1", coords: [30.7000, 76.8060], radius: 520, level: "risky", reports: 44 },
    ],
    alerts: [
      { id: "ca1", title: "Stalking complaint", detail: "Single complaint logged.", area: "Industrial Area", distanceKm: 3.0, level: "risky", time: "12 min ago", source: "Community", coords: [30.7000, 76.8060] },
    ],
  },
  {
    id: "bbi",
    name: "Bhubaneswar",
    short: "BBI",
    tier: 2,
    center: [20.2961, 85.8245],
    user: [20.3009, 85.8200], // Saheed Nagar
    zones: [
      { id: "bb1", name: "Saheed Nagar main", coords: [20.3009, 85.8200], radius: 550, level: "safe", reports: 92 },
      { id: "bb2", name: "Master Canteen square", coords: [20.2700, 85.8420], radius: 500, level: "moderate", reports: 47 },
      { id: "bb3", name: "Old Town Lingaraj lanes", coords: [20.2378, 85.8344], radius: 480, level: "moderate", reports: 33 },
      { id: "bb4", name: "Nayapalli IRC village", coords: [20.2860, 85.8120], radius: 600, level: "safe", reports: 105 },
      { id: "bb5", name: "Khandagiri caves backside", coords: [20.2632, 85.7820], radius: 460, level: "risky", reports: 38 },
    ],
    alerts: [
      { id: "bba1", title: "Power cut", detail: "Street lights down on main road.", area: "Nayapalli", distanceKm: 1.5, level: "moderate", time: "9 min ago", source: "Community", coords: [20.2860, 85.8120] },
    ],
  },
];

export const CITY_BY_ID = Object.fromEntries(CITIES.map((c) => [c.id, c])) as Record<string, CityData>;

/**
 * Landmark database — what users actually say in India.
 * "Big Bazaar ke saamne", "near metro pillar 142", "opp. Andhra mess".
 * Used by the landmark-first search sheet so users don't need exact addresses.
 */
export const LANDMARKS: (Landmark & { cityId: string })[] = [
  // Bengaluru
  { cityId: "blr", id: "lb1", name: "Indiranagar Metro", area: "100 Ft Road", hint: "Pillar 142, near CMH", coords: [12.9784, 77.6408], kind: "metro" },
  { cityId: "blr", id: "lb2", name: "Forum Mall", area: "Koramangala", hint: "Opp. Sony World junction", coords: [12.9344, 77.6101], kind: "mall" },
  { cityId: "blr", id: "lb3", name: "Majestic Bus Stand", area: "Gandhi Nagar", hint: "KSRTC main gate", coords: [12.9774, 77.5712], kind: "bus_stand" },
  { cityId: "blr", id: "lb4", name: "Cubbon Park Metro", area: "MG Road", coords: [12.9762, 77.5993], kind: "metro" },
  { cityId: "blr", id: "lb5", name: "ISKCON Temple", area: "Rajajinagar", hint: "Hare Krishna Hill", coords: [13.0098, 77.5510], kind: "temple" },
  { cityId: "blr", id: "lb6", name: "Manyata Tech Park", area: "Hebbal", coords: [13.0438, 77.6210], kind: "junction" },
  // Hyderabad
  { cityId: "hyd", id: "lh1", name: "Charminar", area: "Old City", hint: "Mecca Masjid side", coords: [17.3616, 78.4747], kind: "junction" },
  { cityId: "hyd", id: "lh2", name: "Hitec City Metro", area: "Madhapur", hint: "Cyber Towers exit", coords: [17.4435, 78.3772], kind: "metro" },
  { cityId: "hyd", id: "lh3", name: "Secunderabad Railway", area: "Secunderabad", coords: [17.4399, 78.5021], kind: "railway" },
  { cityId: "hyd", id: "lh4", name: "Inorbit Mall", area: "Madhapur", coords: [17.4346, 78.3826], kind: "mall" },
  // Delhi
  { cityId: "del", id: "ld1", name: "Connaught Place", area: "Central Delhi", hint: "Inner circle, Block A", coords: [28.6315, 77.2167], kind: "junction" },
  { cityId: "del", id: "ld2", name: "Kashmere Gate ISBT", area: "North Delhi", coords: [28.6675, 77.2287], kind: "bus_stand" },
  { cityId: "del", id: "ld3", name: "New Delhi Railway", area: "Paharganj side", coords: [28.6431, 77.2197], kind: "railway" },
  { cityId: "del", id: "ld4", name: "Select Citywalk", area: "Saket", coords: [28.5286, 77.2188], kind: "mall" },
  { cityId: "del", id: "ld5", name: "Lotus Temple", area: "Kalkaji", coords: [28.5535, 77.2588], kind: "temple" },
  { cityId: "del", id: "ld6", name: "AIIMS Hospital", area: "Ring Road", coords: [28.5672, 77.2100], kind: "hospital" },
  // Jaipur
  { cityId: "jai", id: "lj1", name: "Hawa Mahal", area: "Pink City", hint: "Tripolia bazaar entrance", coords: [26.9239, 75.8267], kind: "junction" },
  { cityId: "jai", id: "lj2", name: "Sindhi Camp Bus Stand", area: "Station Road", coords: [26.9239, 75.7989], kind: "bus_stand" },
  { cityId: "jai", id: "lj3", name: "World Trade Park", area: "Malviya Nagar", coords: [26.8480, 75.8056], kind: "mall" },
  { cityId: "jai", id: "lj4", name: "Birla Mandir", area: "JLN Marg", coords: [26.8916, 75.8156], kind: "temple" },
  // Lucknow
  { cityId: "lko", id: "ll1", name: "Hazratganj GPO", area: "Hazratganj", hint: "Halwasiya market", coords: [26.8512, 80.9450], kind: "junction" },
  { cityId: "lko", id: "ll2", name: "Charbagh Railway", area: "Charbagh", coords: [26.8313, 80.9181], kind: "railway" },
  { cityId: "lko", id: "ll3", name: "Phoenix Palassio", area: "Gomti Nagar", coords: [26.8568, 81.0153], kind: "mall" },
  { cityId: "lko", id: "ll4", name: "Bara Imambara", area: "Old City", coords: [26.8693, 80.9099], kind: "temple" },
  // Indore
  { cityId: "ind", id: "li1", name: "Rajwada Palace", area: "Old City", hint: "Sarafa entry", coords: [22.7177, 75.8545], kind: "junction" },
  { cityId: "ind", id: "li2", name: "Sarwate Bus Stand", area: "Station Road", coords: [22.7110, 75.8675], kind: "bus_stand" },
  { cityId: "ind", id: "li3", name: "C21 Mall", area: "Vijay Nagar", coords: [22.7530, 75.8870], kind: "mall" },
  { cityId: "ind", id: "li4", name: "Khajrana Ganesh Temple", area: "Khajrana", coords: [22.7300, 75.9000], kind: "temple" },
  // Kochi
  { cityId: "kch", id: "lk1", name: "Lulu Mall", area: "Edappally", hint: "NH-66 service road", coords: [10.0273, 76.3082], kind: "mall" },
  { cityId: "kch", id: "lk2", name: "Ernakulam Junction", area: "South Railway", coords: [9.9700, 76.2870], kind: "railway" },
  { cityId: "kch", id: "lk3", name: "Marine Drive Walkway", area: "Ernakulam", coords: [9.9817, 76.2755], kind: "park" },
  { cityId: "kch", id: "lk4", name: "Vyttila Mobility Hub", area: "Vyttila", coords: [9.9670, 76.3180], kind: "bus_stand" },
  // Chandigarh
  { cityId: "chd", id: "lc1", name: "Sector 17 Plaza", area: "City Centre", coords: [30.7410, 76.7681], kind: "junction" },
  { cityId: "chd", id: "lc2", name: "ISBT Sector 43", area: "Sector 43", coords: [30.7106, 76.7729], kind: "bus_stand" },
  { cityId: "chd", id: "lc3", name: "Elante Mall", area: "Industrial Area", coords: [30.7053, 76.8016], kind: "mall" },
  { cityId: "chd", id: "lc4", name: "Sukhna Lake", area: "Sector 1", coords: [30.7421, 76.8186], kind: "park" },
  // Bhubaneswar
  { cityId: "bbi", id: "lbb1", name: "Lingaraj Temple", area: "Old Town", coords: [20.2378, 85.8344], kind: "temple" },
  { cityId: "bbi", id: "lbb2", name: "Master Canteen Square", area: "Station Square", coords: [20.2700, 85.8420], kind: "junction" },
  { cityId: "bbi", id: "lbb3", name: "Esplanade Mall", area: "Rasulgarh", coords: [20.3010, 85.8580], kind: "mall" },
  { cityId: "bbi", id: "lbb4", name: "Bhubaneswar Railway", area: "Master Canteen", coords: [20.2647, 85.8408], kind: "railway" },
];

export const TIER1_CITIES = CITIES.filter((c) => c.tier === 1);
export const TIER2_CITIES = CITIES.filter((c) => c.tier === 2);
