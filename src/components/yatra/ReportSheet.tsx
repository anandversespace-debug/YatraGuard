import { useState } from "react";
import { X, MapPin, Send } from "lucide-react";
import {
  REASON_META,
  addReport,
  type ReportReason,
} from "@/lib/reports-store";
import { track } from "@/lib/analytics-store";
import type { LatLng } from "@/lib/mock-data";

const REASONS: ReportReason[] = ["harassment", "stalking", "theft_risk", "dark_road", "accident", "crowd"];

const NOTE_MAX = 140;

export function ReportSheet({
  open,
  onClose,
  defaultCoords,
  defaultArea = "Near my location",
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  defaultCoords: LatLng;
  defaultArea?: string;
  onSubmitted?: () => void;
}) {
  const [reason, setReason] = useState<ReportReason>("dark_road");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = () => {
    setSubmitting(true);
    const trimmed = note.trim().slice(0, NOTE_MAX);
    addReport({ reason, coords: defaultCoords, area: defaultArea, note: trimmed || undefined });
    track("report_submitted", { reason });
    setTimeout(() => {
      setSubmitting(false);
      setNote("");
      onSubmitted?.();
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-[420px] bg-card border-t sm:border border-border sm:rounded-3xl rounded-t-3xl p-5 shadow-elevated animate-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Crowd report</p>
            <h3 className="text-lg font-semibold">Report unsafe area</h3>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl bg-background border border-border flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-3">
          <MapPin className="h-3 w-3" /> {defaultArea} • {defaultCoords[0].toFixed(4)}, {defaultCoords[1].toFixed(4)}
        </p>

        <p className="text-xs font-semibold mb-2">What happened?</p>
        <div className="grid grid-cols-3 gap-2">
          {REASONS.map((r) => {
            const m = REASON_META[r];
            const active = reason === r;
            const tone = m.tier === "risky" ? "danger" : "warning";
            return (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`rounded-2xl p-2.5 border text-center transition-all ${
                  active
                    ? `bg-${tone}/15 border-${tone}/50 text-${tone}`
                    : "bg-background/60 border-border text-muted-foreground"
                }`}
              >
                <p className="text-lg leading-none">{m.emoji}</p>
                <p className="text-[10px] font-semibold mt-1 leading-tight">{m.label}</p>
              </button>
            );
          })}
        </div>

        <p className="text-xs font-semibold mt-4 mb-1.5">Add detail (optional)</p>
        <textarea
          value={note}
          maxLength={NOTE_MAX}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Two streetlights out, isolated lane after 9pm"
          className="w-full min-h-[72px] px-3 py-2 rounded-xl bg-background border border-border text-sm resize-none"
        />
        <p className="text-[10px] text-muted-foreground text-right">{note.length}/{NOTE_MAX}</p>

        <p className="text-[11px] text-muted-foreground mt-2">
          Reports are anonymous and expire automatically after 2 hours unless others confirm.
        </p>

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-4 w-full rounded-xl gradient-danger text-white py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> {submitting ? "Sending…" : "Send anonymous report"}
        </button>
      </div>
    </div>
  );
}