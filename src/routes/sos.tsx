import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Mic,
  Video,
  Volume2,
  VolumeX,
  Share2,
  Copy,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PhoneShell } from "@/components/yatra/PhoneShell";
import { EmergencyContactList } from "@/components/yatra/EmergencyContactList";
import { QUICK_DIAL, EMERGENCY_CONTACTS } from "@/lib/mock-data";
import {
  triggerSos,
  stopSiren,
  startSiren,
  loadContacts,
  buildMessage,
  type SosSession,
} from "@/lib/sos-service";
import { track } from "@/lib/analytics-store";

export const Route = createFileRoute("/sos")({
  head: () => ({ meta: [{ title: "Emergency SOS — YatraGuard" }] }),
  component: SosPage,
});

const HOLD_MS = 2500;

function SosPage() {
  const [progress, setProgress] = useState(0);
  const [session, setSession] = useState<SosSession | null>(null);
  const [muted, setMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [dispatchedCount, setDispatchedCount] = useState(0);
  const holdRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (holdRef.current) clearInterval(holdRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    stopSiren();
  }, []);

  // Animate dispatch progress + elapsed timer when active
  useEffect(() => {
    if (!session) return;
    setElapsed(0);
    setDispatchedCount(0);
    const total = session.dispatches.length;
    tickRef.current = window.setInterval(() => {
      setElapsed((e) => e + 1);
      setDispatchedCount((d) => Math.min(total, d + 1));
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [session]);

  const start = () => {
    if (session) return;
    const t0 = Date.now();
    holdRef.current = window.setInterval(() => {
      const p = Math.min(100, ((Date.now() - t0) / HOLD_MS) * 100);
      setProgress(p);
      if (p >= 100) {
        if (holdRef.current) clearInterval(holdRef.current);
        triggerSos(loadContacts(EMERGENCY_CONTACTS)).then((s) => {
          setSession(s);
          track("sos_triggered");
        });
      }
    }, 30);
  };
  const cancel = () => {
    if (holdRef.current) clearInterval(holdRef.current);
    if (!session) setProgress(0);
  };

  const endSos = () => {
    stopSiren();
    setSession(null);
    setProgress(0);
    setMuted(false);
  };

  const toggleMute = () => {
    if (muted) { startSiren(); setMuted(false); }
    else { stopSiren(); setMuted(true); }
  };

  const copyLink = async () => {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(session.trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  const shareWhatsapp = () => {
    if (!session?.location) return;
    const msg = buildMessage("me", session.location, session.trackingUrl);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <PhoneShell>
      <div className="flex items-center gap-3 mb-5">
        <Link to="/" className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold leading-tight">Emergency SOS</h1>
          <p className="text-xs text-muted-foreground">
            {session ? "SOS active — help is on the way" : "Hold the button to alert your circle"}
          </p>
        </div>
      </div>

      {!session ? (
        <>
          <div className="flex flex-col items-center mt-2">
            <button
              onPointerDown={start}
              onPointerUp={cancel}
              onPointerLeave={cancel}
              onPointerCancel={cancel}
              className="relative h-60 w-60 rounded-full gradient-danger flex items-center justify-center select-none touch-none animate-sos-halo shadow-elevated active:scale-[0.98] transition-transform"
            >
              <div className="absolute -inset-3 rounded-full border border-danger/40 animate-pulse-soft" />
              <div className="absolute inset-2 rounded-full border-2 border-white/30" />
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${(progress / 100) * 289.03} 289.03`}
                />
              </svg>
              <div className="text-center text-white relative">
                <p className="num-display text-6xl font-extrabold">SOS</p>
                <p className="text-[11px] mt-1 opacity-90">Hold 2.5 sec</p>
              </div>
            </button>
            <p className="text-xs text-muted-foreground mt-6 text-center max-w-[280px]">
              Sends your live location, a tracking link, and a help message to your trusted contacts via WhatsApp & SMS.
            </p>
          </div>
        </>
      ) : (
        <ActiveSosPanel
          session={session}
          elapsed={elapsed}
          dispatchedCount={dispatchedCount}
          muted={muted}
          copied={copied}
          onMute={toggleMute}
          onCopy={copyLink}
          onWhatsapp={shareWhatsapp}
          onEnd={endSos}
        />
      )}

      <div className="mt-6">
        <p className="text-xs font-semibold mb-2 flex items-center gap-1">
          <Phone className="h-3.5 w-3.5" /> Quick dial
        </p>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_DIAL.map((q) => (
            <a
              key={q.id}
              href={`tel:${q.number}`}
              className={`rounded-2xl p-3 bg-${q.tone}/10 border border-${q.tone}/30 text-center`}
            >
              <p className={`text-xl font-bold text-${q.tone}`}>{q.number}</p>
              <p className="text-[11px] text-muted-foreground">{q.label}</p>
            </a>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <EmergencyContactList />
      </div>
    </PhoneShell>
  );
}

function ActiveSosPanel({
  session, elapsed, dispatchedCount, muted, copied,
  onMute, onCopy, onWhatsapp, onEnd,
}: {
  session: SosSession;
  elapsed: number;
  dispatchedCount: number;
  muted: boolean;
  copied: boolean;
  onMute: () => void;
  onCopy: () => void;
  onWhatsapp: () => void;
  onEnd: () => void;
}) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="space-y-3">
      <div className="rounded-3xl p-5 bg-danger/10 border border-danger/40 glow-danger">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-danger font-bold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-danger animate-pulse-soft" /> SOS Active
            </p>
            <p className="text-lg font-semibold mt-1">Help is on the way</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
              <Clock className="h-3 w-3" /> Elapsed
            </p>
            <p className="text-xl font-bold tabular-nums">{mm}:{ss}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Action icon={MapPin} label="Live GPS" />
          <Action icon={Mic} label="Recording" />
          <Action icon={Video} label="Video clip" />
        </div>

        {session.location && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            📍 {session.location.lat.toFixed(5)}, {session.location.lng.toFixed(5)}
            {" "}· ±{Math.round(session.location.accuracy ?? 25)}m
          </p>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={onMute}
            className="flex-1 rounded-xl bg-background/50 border border-border py-2 text-xs font-medium flex items-center justify-center gap-1.5"
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            {muted ? "Siren muted" : "Mute siren"}
          </button>
          <button
            onClick={onEnd}
            className="flex-1 rounded-xl bg-card border border-border py-2 text-xs font-semibold"
          >
            I'm safe — cancel
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-4 bg-card border border-border">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Share2 className="h-3.5 w-3.5 text-info" /> Live tracking link
        </p>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 text-[11px] bg-background rounded-lg px-2.5 py-2 border border-border truncate">
            {session.trackingUrl}
          </code>
          <button onClick={onCopy} className="h-9 w-9 rounded-xl bg-info/15 text-info flex items-center justify-center">
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <button
          onClick={onWhatsapp}
          className="mt-2 w-full rounded-xl bg-safe text-safe-foreground py-2.5 text-sm font-semibold"
        >
          Share on WhatsApp
        </button>
      </div>

      <div className="rounded-2xl p-4 bg-card border border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold">Notifying contacts</p>
          <p className="text-[11px] text-muted-foreground">
            {dispatchedCount}/{session.dispatches.length} sent
          </p>
        </div>
        <div className="space-y-1.5 max-h-44 overflow-y-auto">
          {session.dispatches.map((d, i) => {
            const sent = i < dispatchedCount;
            return (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${sent ? "bg-safe" : "bg-muted-foreground/40 animate-pulse-soft"}`}
                />
                <span className="font-medium flex-1 truncate">{d.contact.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                  d.channel === "whatsapp" ? "bg-safe/15 text-safe" : "bg-info/15 text-info"
                }`}>
                  {d.channel}
                </span>
                <span className={sent ? "text-safe" : "text-muted-foreground"}>
                  {sent ? "Delivered" : "Sending…"}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          Police (100) will be auto-notified in {Math.max(0, 30 - elapsed)}s.
        </p>
      </div>
    </div>
  );
}

function Action({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return (
    <div className="rounded-xl p-2.5 bg-background/50 border border-border text-center">
      <Icon className="h-4 w-4 mx-auto text-danger" />
      <p className="text-[10px] mt-1 font-medium">{label}</p>
      <p className="text-[9px] text-safe">● Live</p>
    </div>
  );
}