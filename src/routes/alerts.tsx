import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Bell, MapPin, Clock, Radio, Plus, ThumbsUp, ThumbsDown,
  ShieldCheck, Hourglass,
} from "lucide-react";
import { PhoneShell } from "@/components/yatra/PhoneShell";
import { BottomNav } from "@/components/yatra/BottomNav";
import { ReportSheet } from "@/components/yatra/ReportSheet";
import { LIVE_ALERTS } from "@/lib/mock-data";
import {
  useReports, confirmReport, disputeReport, credibility,
  relativeTime, expiresIn, REASON_META, type ReportReason,
} from "@/lib/reports-store";
import { track } from "@/lib/analytics-store";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Live alerts — YatraGuard" }] }),
  component: AlertsPage,
});

const TABS = [
  { id: "all", label: "All" },
  { id: "crowd", label: "Crowd reports" },
  { id: "official", label: "Official" },
] as const;
type TabId = typeof TABS[number]["id"];

function AlertsPage() {
  const reports = useReports();
  const [tab, setTab] = useState<TabId>("all");
  const [openReport, setOpenReport] = useState(false);
  useEffect(() => { track("alert_viewed"); }, []);

  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => credibility(b).score - credibility(a).score),
    [reports],
  );

  const showOfficial = tab !== "crowd";
  const showCrowd = tab !== "official";

  return (
    <PhoneShell>
      <div className="flex items-center gap-3 mb-4">
        <Link to="/" className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold leading-tight">Live alerts</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Radio className="h-3 w-3 text-safe animate-pulse-soft" /> Live • {reports.length} crowd + {LIVE_ALERTS.length} official
          </p>
        </div>
        <button
          onClick={() => setOpenReport(true)}
          className="h-10 px-3 rounded-xl gradient-danger text-white flex items-center gap-1.5 text-xs font-semibold shadow-elevated"
        >
          <Plus className="h-4 w-4" /> Report
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-3">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {showCrowd && (
        <div className="space-y-3 mt-1">
          {sortedReports.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
              No active community reports nearby. Tap <span className="text-danger font-semibold">Report</span> if you spot something unsafe.
            </div>
          )}
          {sortedReports.map((r) => (
            <CrowdReportCard
              key={r.id}
              report={r}
              onConfirm={() => confirmReport(r.id)}
              onDispute={() => disputeReport(r.id)}
            />
          ))}
        </div>
      )}

      {showOfficial && (
        <div className="space-y-3 mt-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Official feeds</p>
          {LIVE_ALERTS.map((a) => {
          const tone = a.level === "risky" ? "danger" : a.level === "moderate" ? "warning" : "safe";
          return (
            <div key={a.id} className={`rounded-2xl p-4 bg-card border border-border relative overflow-hidden`}>
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${tone}`} />
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl bg-${tone}/15 flex items-center justify-center shrink-0`}>
                  <Bell className={`h-4 w-4 text-${tone}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight">{a.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${tone}/15 text-${tone} font-semibold uppercase shrink-0`}>
                      {a.level}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.detail}</p>
                  <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.area}</span>
                    <span>{a.distanceKm} km away</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-[10px] text-muted-foreground">Source: {a.source}</span>
                    <button className="text-[11px] text-primary font-medium">Reroute around →</button>
                  </div>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}

      <BottomNav />

      <ReportSheet
        open={openReport}
        onClose={() => setOpenReport(false)}
        defaultCoords={[12.9719, 77.6412]}
        defaultArea="Indiranagar, Bengaluru"
      />
    </PhoneShell>
  );
}

function CrowdReportCard({
  report, onConfirm, onDispute,
}: {
  report: ReturnType<typeof useReports>[number];
  onConfirm: () => void;
  onDispute: () => void;
}) {
  const meta = REASON_META[report.reason as ReportReason];
  const cred = credibility(report);
  const tone = cred.level === "high" ? "danger" : cred.level === "medium" ? "warning" : "muted-foreground";
  return (
    <div className="rounded-2xl p-4 bg-card border border-border relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${meta.tier === "risky" ? "danger" : "warning"}`} />
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0 text-lg">
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-tight">{meta.label}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 flex items-center gap-1
              bg-${tone === "muted-foreground" ? "muted" : `${tone}/15`} text-${tone}`}>
              <ShieldCheck className="h-2.5 w-2.5" />
              {cred.level} • {cred.score}
            </span>
          </div>
          {report.note && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">"{report.note}"</p>
          )}
          <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {report.area}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {relativeTime(report.createdAt)}</span>
            <span className="flex items-center gap-1"><Hourglass className="h-3 w-3" /> {expiresIn(report.expiresAt)}</span>
          </div>
          <div className="flex items-center justify-between mt-3 gap-2">
            <span className="text-[10px] text-muted-foreground">
              {report.confirmations} confirmed · {report.disputes} disputed
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={onConfirm}
                className="h-8 px-2.5 rounded-lg bg-safe/15 text-safe text-[11px] font-semibold flex items-center gap-1"
              >
                <ThumbsUp className="h-3 w-3" /> Confirm
              </button>
              <button
                onClick={onDispute}
                className="h-8 px-2.5 rounded-lg bg-background border border-border text-muted-foreground text-[11px] font-semibold flex items-center gap-1"
              >
                <ThumbsDown className="h-3 w-3" /> Dispute
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
