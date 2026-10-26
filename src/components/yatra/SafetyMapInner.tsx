import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Circle, useMap, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LatLng, RouteOption, HeatZone, RiskAlert } from "@/lib/mock-data";
import type { CrowdReport } from "@/lib/reports-store";
import { credibility, REASON_META } from "@/lib/reports-store";
import { isLite } from "@/lib/lite-mode";

interface Props {
  center: LatLng;
  zoom?: number;
  routes?: RouteOption[];
  selectedRouteId?: string;
  heatZones?: HeatZone[];
  alerts?: RiskAlert[];
  reports?: CrowdReport[];
  origin?: LatLng;
  destination?: LatLng;
  user?: LatLng;
  height?: string;
  interactive?: boolean;
  showHeatmap?: boolean;
  onMapTap?: (coords: LatLng) => void;
  highlight?: LatLng | null;
}

const tierColor = (tier: string) =>
  tier === "safe" ? "oklch(0.78 0.18 155)" : tier === "moderate" ? "oklch(0.82 0.17 75)" : "oklch(0.65 0.24 25)";

const routeColor = (kind: string) =>
  kind === "safest" ? "oklch(0.78 0.18 155)" : kind === "balanced" ? "oklch(0.82 0.17 75)" : "oklch(0.65 0.24 25)";

function Resizer() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function FlyTo({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom, { animate: true }); }, [center, zoom, map]);
  return null;
}

function TapHandler({ onTap }: { onTap: (c: LatLng) => void }) {
  useMapEvents({ click: (e) => onTap([e.latlng.lat, e.latlng.lng]) });
  return null;
}

const pinIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 0 0 3px ${color}55"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const userIcon = () =>
  L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:18px;height:18px">
        <div style="position:absolute;inset:-12px;border-radius:9999px;background:oklch(0.75 0.15 230 / 0.18);animation:yg-userpulse 2s ease-out infinite"></div>
        <div style="position:absolute;inset:0;border-radius:9999px;background:oklch(0.75 0.15 230);border:3px solid white;box-shadow:0 0 12px oklch(0.75 0.15 230 / 0.7)"></div>
      </div>
      <style>@keyframes yg-userpulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.6);opacity:0}}</style>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const tapPin = () =>
  L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:oklch(0.97 0.01 250);border:3px solid oklch(0.78 0.18 155);box-shadow:0 0 16px oklch(0.78 0.18 155 / 0.7)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

export function SafetyMap({
  center, zoom = 14,
  routes = [], selectedRouteId,
  heatZones = [], alerts = [], reports = [],
  origin, destination, user,
  height = "100%", interactive = true,
  showHeatmap = true,
  onMapTap, highlight,
}: Props) {
  const lite = isLite();
  return (
    <div style={{ height, width: "100%" }} className="relative">
      <MapContainer
        center={center as [number, number]} zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false} attributionControl={false}
        dragging={interactive} scrollWheelZoom={interactive}
        doubleClickZoom={interactive} touchZoom={interactive}
      >
        <Resizer />
        <FlyTo center={center} zoom={zoom} />
        {onMapTap && <TapHandler onTap={onMapTap} />}
        {/* Lite Mode skips OSM tiles entirely → ~80% less data on map screens. */}
        {!lite && <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />}

        {showHeatmap && heatZones.flatMap((z) => {
          const color = tierColor(z.level);
          const pulsing = z.level === "risky";
          const items = [
            <Circle
              key={`${z.id}-base`}
              center={z.coords as [number, number]}
              radius={z.radius}
              pathOptions={{
                color, fillColor: color,
                fillOpacity: z.level === "safe" ? 0.16 : z.level === "moderate" ? 0.22 : 0.28,
                weight: 1.5, opacity: 0.7,
              }}
            />,
          ];
          if (pulsing) {
            items.push(
              <Circle
                key={`${z.id}-pulse`}
                center={z.coords as [number, number]}
                radius={z.radius * 1.45}
                pathOptions={{
                  color, fillColor: color, fillOpacity: 0.08,
                  weight: 0, className: "yg-pulse-zone",
                }}
              />
            );
          }
          return items;
        })}

        {alerts.map((a) => (
          <CircleMarker
            key={a.id}
            center={a.coords as [number, number]}
            radius={6}
            pathOptions={{ color: tierColor(a.level), fillColor: tierColor(a.level), fillOpacity: 0.95, weight: 2 }}
          />
        ))}

        {reports.map((r) => {
          const meta = REASON_META[r.reason];
          const cred = credibility(r);
          const color = tierColor(meta.tier);
          const radius = 70 + cred.score * 1.4; // higher credibility → larger ring
          return (
            <Circle
              key={r.id}
              center={r.coords as [number, number]}
              radius={radius}
              pathOptions={{
                color, fillColor: color,
                fillOpacity: 0.12 + Math.min(0.25, cred.score / 400),
                weight: 1.5, opacity: 0.7,
                className: cred.level === "high" ? "yg-pulse-zone" : "",
              }}
            />
          );
        })}

        {routes.map((r) => {
          const selected = r.id === selectedRouteId;
          return (
            <Polyline
              key={r.id}
              positions={r.path as [number, number][]}
              pathOptions={{
                color: routeColor(r.kind),
                weight: selected ? 7 : 4,
                opacity: selected ? 1 : 0.45,
                lineCap: "round", lineJoin: "round",
                className: selected && r.kind === "safest" ? "route-flow" : "",
              }}
            />
          );
        })}

        {origin && <Marker position={origin as [number, number]} icon={pinIcon("oklch(0.75 0.15 230)")} />}
        {destination && <Marker position={destination as [number, number]} icon={pinIcon("oklch(0.78 0.18 155)")} />}
        {user && <Marker position={user as [number, number]} icon={userIcon()} />}
        {highlight && <Marker position={highlight as [number, number]} icon={tapPin()} />}
      </MapContainer>
    </div>
  );
}
