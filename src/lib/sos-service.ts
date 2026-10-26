// YatraGuard SOS service — handles siren, geolocation, and simulated message dispatch.
import type { EmergencyContact } from "./mock-data";

export interface SosLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export interface SosDispatch {
  contact: EmergencyContact;
  channel: "whatsapp" | "sms";
  status: "queued" | "sent" | "delivered";
  at: number;
}

export interface SosSession {
  id: string;
  startedAt: number;
  trackingUrl: string;
  location: SosLocation | null;
  dispatches: SosDispatch[];
}

const STORAGE_KEY = "yg.contacts.v1";

export function loadContacts(fallback: EmergencyContact[]): EmergencyContact[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
    return fallback;
  } catch {
    return fallback;
  }
}

export function saveContacts(contacts: EmergencyContact[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

export function getCurrentLocation(): Promise<SosLocation> {
  return new Promise((resolve) => {
    const fallback: SosLocation = {
      lat: 12.9719,
      lng: 77.6412,
      accuracy: 25,
      timestamp: Date.now(),
    };
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(fallback);
      return;
    }
    const t = setTimeout(() => resolve(fallback), 1500);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(t);
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      () => {
        clearTimeout(t);
        resolve(fallback);
      },
      { enableHighAccuracy: true, timeout: 1500, maximumAge: 0 },
    );
  });
}

export function buildTrackingUrl(sessionId: string) {
  return `https://yatraguard.link/track/${sessionId}`;
}

export function buildMessage(name: string, loc: SosLocation, trackingUrl: string) {
  const maps = `https://maps.google.com/?q=${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}`;
  return (
    `🚨 SOS from ${name} via YatraGuard.\n` +
    `I need help. Live location: ${maps}\n` +
    `Track me live: ${trackingUrl}`
  );
}

// ---- Siren via WebAudio (no asset required) ----
let audioCtx: AudioContext | null = null;
let sirenStop: (() => void) | null = null;

export function startSiren() {
  if (typeof window === "undefined") return;
  if (sirenStop) return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = audioCtx ?? new Ctx();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(720, ctx.currentTime);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    // Two-tone wail
    const interval = window.setInterval(() => {
      const t = ctx.currentTime;
      osc.frequency.cancelScheduledValues(t);
      osc.frequency.setValueAtTime(720, t);
      osc.frequency.linearRampToValueAtTime(420, t + 0.45);
      osc.frequency.linearRampToValueAtTime(720, t + 0.9);
    }, 900);
    sirenStop = () => {
      window.clearInterval(interval);
      try { osc.stop(); } catch { /* noop */ }
      try { osc.disconnect(); } catch { /* noop */ }
      try { gain.disconnect(); } catch { /* noop */ }
      sirenStop = null;
    };
  } catch {
    sirenStop = null;
  }
}

export function stopSiren() {
  if (sirenStop) sirenStop();
}

export function vibratePulse() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate([300, 120, 300, 120, 600]); } catch { /* noop */ }
  }
}

export async function triggerSos(contacts: EmergencyContact[]): Promise<SosSession> {
  const id = Math.random().toString(36).slice(2, 9).toUpperCase();
  const location = await getCurrentLocation();
  const trackingUrl = buildTrackingUrl(id);
  const dispatches: SosDispatch[] = contacts.flatMap((c) => [
    { contact: c, channel: "whatsapp", status: "queued", at: Date.now() },
    { contact: c, channel: "sms", status: "queued", at: Date.now() + 50 },
  ]);
  startSiren();
  vibratePulse();
  return { id, startedAt: Date.now(), trackingUrl, location, dispatches };
}