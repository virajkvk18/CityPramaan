/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Blocks,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileImage,
  Fingerprint,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { LanguageSelector } from "@/src/components/layout/LanguageSelector";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { ChainProofCard } from "@/src/components/proof/ChainProofCard";
import { getCitySnapshot, subscribeCity } from "@/src/lib/city-storage";
import { getReportsForCity, type CivicReport } from "@/src/lib/mock-data";
import {
  appendReportEvent,
  getLocalReportsSnapshot,
  subscribeLocalReports,
  upsertLocalReport,
} from "@/src/lib/report-storage";
import { useLanguage } from "@/src/lib/use-language";

const statusTone: Record<CivicReport["status"], string> = {
  OPEN: "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]",
  PENDING_PROOF: "border-[#00dbe9]/35 bg-[#00dbe9]/10 text-[#7df4ff]",
  REPAIR_SUBMITTED: "border-[#ff9933]/35 bg-[#ff9933]/10 text-[#ffc08d]",
  UNDER_WARRANTY: "border-[#00eb88]/35 bg-[#00eb88]/10 text-[#5bffa1]",
  REPEAT_FAILURE: "border-[#d946ef]/40 bg-[#d946ef]/12 text-[#f0abfc]",
  CLOSED: "border-[#00eb88]/35 bg-[#00eb88]/10 text-[#5bffa1]",
};

export default function ProofTimelinePage() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const proofId = params.id;
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => "bhopal");
  const localReportsSnapshot = useSyncExternalStore(
    subscribeLocalReports,
    getLocalReportsSnapshot,
    () => "[]"
  );
  const localReports = useMemo(
    () => JSON.parse(localReportsSnapshot) as CivicReport[],
    [localReportsSnapshot]
  );
  const cityReports = useMemo(() => getReportsForCity(citySnapshot), [citySnapshot]);
  const allReports = useMemo(() => {
    const localIds = new Set(localReports.map((report) => report.id));
    return [...localReports, ...cityReports.filter((report) => !localIds.has(report.id))];
  }, [cityReports, localReports]);
  const report = allReports.find((item) => item.id === proofId) ?? cityReports[3];
  const events = report.history?.length ? report.history : fallbackEvents(report);
  const hasRepairProof = Boolean(report.repairImageDataUrl || report.repairImageName);
  const isWarrantyActive = report.status === "UNDER_WARRANTY" || report.status === "REPEAT_FAILURE" || report.status === "CLOSED";
  const [feedbackText, setFeedbackText] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  function getLatestReport() {
    try {
      const savedReports = JSON.parse(getLocalReportsSnapshot()) as CivicReport[];
      return savedReports.find((item) => item.id === report.id) ?? report;
    } catch {
      return report;
    }
  }

  function savePublicFeedback() {
    const message = feedbackText.trim();

    if (!message) {
      setActionMessage("Write public feedback first.");
      return;
    }

    const now = new Date();
    const feedback = {
      id: `FDB-${now.getTime()}`,
      author: "Public reviewer",
      message,
      createdAt: now.toISOString(),
    };
    const latestReport = getLatestReport();
    const updated = appendReportEvent(
      {
        ...latestReport,
        cityKey: latestReport.cityKey ?? citySnapshot,
        publicFeedback: [...(latestReport.publicFeedback ?? []), feedback],
      },
      {
        label: "Public feedback sent to issue owner",
        detail: message,
        time: now.toLocaleString(),
        tx: `0xfb${now.getTime().toString(16).slice(-6)}...note`,
      }
    );

    upsertLocalReport(updated);
    setFeedbackText("");
    setActionMessage("Feedback added. The issue owner can review it before closing the case.");
  }

  function closeIssue() {
    const latestReport = getLatestReport();

    if (latestReport.status === "CLOSED") {
      setActionMessage("This issue is already closed.");
      return;
    }

    const latestHasRepairProof = Boolean(latestReport.repairImageDataUrl || latestReport.repairImageName);

    if (!latestHasRepairProof) {
      setActionMessage("Repair proof is required before the issue owner can close this case.");
      return;
    }

    const now = new Date();
    const updated = appendReportEvent(
      {
        ...latestReport,
        cityKey: latestReport.cityKey ?? citySnapshot,
        status: "CLOSED",
        ownerVerified: true,
        closedAt: now.toISOString(),
        closureNote: "Issue owner verified the repair and closed the case.",
        warrantyDaysLeft: 0,
      },
      {
        label: "Issue closed by report issuer",
        detail:
          "Repair accepted after public proof review. The case is removed from the active command center map but stays in public history.",
        time: now.toLocaleString(),
        tx: `0xcl0...${report.id.replace("CP-", "")}`,
      }
    );

    upsertLocalReport(updated);
    setActionMessage("Issue closed and synced. It will no longer appear on the command center map.");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,153,51,0.16),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(0,219,233,0.14),transparent_28%),radial-gradient(circle_at_48%_94%,rgba(0,235,136,0.08),transparent_30%)]" />
      <div className="bg-holo-grid pointer-events-none fixed inset-0" />
      <div className="stitch-cityline pointer-events-none fixed bottom-0 left-0 right-0 h-44 opacity-20" />

      <header className="relative z-10 flex h-16 items-center justify-between border-b border-[#ff9933]/15 bg-[#030507]/75 px-6 shadow-[0_0_30px_rgba(0,219,233,0.08)] backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
          <ArrowLeft size={16} />
          {t("backToCommandCenter")}
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSelector compact />
          <BrandLogo size="sm" subtitle={t("publicProof")} />
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 xl:grid-cols-[1fr_380px] xl:px-6 xl:py-8">
        <div>
          <div className="rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(145deg,rgba(217,70,239,0.16),rgba(0,219,233,0.06))] p-6 shadow-[0_0_24px_rgba(217,70,239,0.1)]">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.16em] ${statusTone[report.status]}`}
              >
                {report.status === "REPEAT_FAILURE" ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
                {statusCopy(report.status, t)}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#dbc2b0]">
                {t("publicCase")} {report.id}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("publicProofTimeline")}: {report.title}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              Every citizen report, AI audit, contractor repair image, warranty activation, and
              public status update is tied to one visible proof record. This is the page judges can
              open to verify what changed after a repair.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Badge icon={<MapPin size={15} />} label={report.location} />
              <Badge icon={<CalendarClock size={15} />} label={warrantyLabel(report, t)} />
              <Badge icon={<Blocks size={15} />} label={`${events.length} ${t("proofEventsIndexed")}`} />
              <Badge icon={<Fingerprint size={15} />} label={`${t("contractor")}: ${report.contractor}`} />
            </div>
          </div>

          <div className="cp-cyber-card cp-cyber-card-hover mt-6 rounded-2xl p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-orange-300">{t("publicAudit")}</p>
                <h2 className="mt-1 text-2xl font-semibold">{t("proofTimeline")}</h2>
              </div>

              <button className="flex w-max items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                {t("viewContract")}
                <ExternalLink size={15} />
              </button>
            </div>

            <div className="space-y-0">
              {events.map((event, index) => {
                const Icon = eventIcon(event.label);

                return (
                  <div key={`${event.label}-${index}`} className="grid grid-cols-[36px_1fr] gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`grid h-9 w-9 place-items-center rounded-full ${toneClass(index, events.length)}`}>
                        <Icon size={17} />
                      </div>
                      {index !== events.length - 1 && <div className="h-16 w-px bg-white/10" />}
                    </div>

                    <div className="pb-7">
                      <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{event.label}</p>
                            <p className="mt-1 text-sm text-zinc-400">{event.detail}</p>
                          </div>
                          <p className="shrink-0 text-xs text-zinc-500">{event.time}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                          <span className="text-xs text-zinc-500">{t("blockchainTransaction")}</span>
                          <span className="truncate text-xs text-emerald-300">
                            {event.tx ?? report.repairTxHash ?? report.evidenceHash ?? report.txHash}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <EvidenceCard
              label={t("issueBefore")}
              status={report.issueImageName ?? report.aiSummary ?? "Citizen-submitted issue evidence"}
              tone="red"
              pattern="pothole"
              image={report.issueImageDataUrl}
            />
            <EvidenceCard
              label={t("contractorProofAfter")}
              status={
                hasRepairProof
                  ? report.repairImageName ?? "Contractor repair evidence attached"
                  : t("noRepairProofYet")
              }
              tone={hasRepairProof ? "emerald" : "orange"}
              pattern="patch"
              image={report.repairImageDataUrl}
            />
          </div>
        </div>

        <aside className="space-y-5">
          <ChainProofCard />

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-cyan-300" />
              <p className="font-medium">{t("aiVerdict")}</p>
            </div>

            <div className="mt-5 space-y-3">
              <Score label={t("aiConfidence")} value={`${report.confidence}%`} />
              <Score label="Before / after delta" value={report.repairAudit?.beforeAfterDelta ?? (hasRepairProof ? "84% improvement" : t("pending"))} />
              <Score label="Closure confidence" value={report.repairAudit?.closureConfidence ?? (hasRepairProof ? "92.7%" : t("pending"))} />
              <Score label={t("repairIntegrity")} value={report.repairAudit?.repairIntegrity ?? (hasRepairProof ? "High" : t("pending"))} />
              <Score label={t("geoMatch")} value={report.repairAudit?.geoVariance ?? (hasRepairProof ? "1.8m" : t("pending"))} />
              <Score label="Visible damage left" value={report.repairAudit?.visibleDamageRemaining ?? (hasRepairProof ? "Low" : t("pending"))} />
              <Score label={t("publicStatus")} value={statusCopy(report.status, t)} />
            </div>

            <p className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm text-zinc-300">
              {report.repairAudit?.recommendation ??
                report.recommendedAction ??
                "CityPramaan keeps the case open until repair evidence and warranty proof are visible."}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2">
              <FileImage size={18} className="text-orange-300" />
              <p className="font-medium">{t("publicEvidenceState")}</p>
            </div>

            <div className="mt-4 space-y-3">
              <MiniState done label={t("issueImageVisible")} synced={t("active")} pending={t("pending")} />
              <MiniState done={hasRepairProof} label={t("repairImageVisible")} synced={t("active")} pending={t("pending")} />
              <MiniState done={isWarrantyActive} label={t("warrantyActivated")} synced={t("active")} pending={t("pending")} />
            </div>

            <Link
              href="/warranty"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-4 py-3 text-sm font-semibold text-[#7df4ff] hover:bg-[#00dbe9]/15"
            >
              {t("openWarrantyRegistry")}
              <ExternalLink size={15} />
            </Link>
          </div>

          <div className="rounded-2xl border border-[#00eb88]/20 bg-[#00eb88]/5 p-5">
            <div className="flex items-center gap-2 text-[#5bffa1]">
              <UserCheck size={18} />
              <p className="font-medium">Public feedback & issuer closure</p>
            </div>

            <p className="mt-3 text-sm leading-6 text-zinc-300">
              If citizens can see the repair proof here, they can leave feedback for the report issuer.
              The issuer can close the issue only after repair proof exists.
            </p>

            <textarea
              value={feedbackText}
              onChange={(event) => setFeedbackText(event.target.value)}
              placeholder="Example: Patch looks complete, but one edge still has loose gravel."
              className="mt-4 min-h-24 w-full resize-none rounded-lg border border-white/10 bg-zinc-950/70 px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#00dbe9]/55"
            />

            <div className="mt-3 grid gap-3">
              <button
                onClick={savePublicFeedback}
                className="rounded-lg border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-4 py-3 text-sm font-semibold text-[#7df4ff] transition hover:bg-[#00dbe9]/15"
              >
                Send feedback to issuer
              </button>
              <button
                onClick={closeIssue}
                disabled={!hasRepairProof || report.status === "CLOSED"}
                className="rounded-lg border border-[#00eb88]/35 bg-[#00eb88]/12 px-4 py-3 text-sm font-semibold text-[#5bffa1] transition hover:bg-[#00eb88]/18 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {report.status === "CLOSED" ? "Issue closed" : "Issue owner: mark solved & close"}
              </button>
            </div>

            {actionMessage && (
              <p className="mt-3 rounded-lg border border-[#ffc08d]/20 bg-[#ffc08d]/10 p-3 text-sm text-[#ffdcc2]">
                {actionMessage}
              </p>
            )}

            {report.publicFeedback?.length ? (
              <div className="mt-4 space-y-3">
                {report.publicFeedback.map((feedback) => (
                  <div key={feedback.id} className="rounded-lg border border-white/10 bg-zinc-950/55 p-3">
                    <p className="text-sm leading-6 text-zinc-200">{feedback.message}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {feedback.author} | {new Date(feedback.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-5">
            <div className="flex items-center gap-2 text-fuchsia-200">
              <ShieldAlert size={18} />
              <p className="font-medium">{t("accountabilityImpact")}</p>
            </div>

            <ul className="mt-4 space-y-3 text-sm text-zinc-300">
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-emerald-300" />
                {t("publicStatusUpdates")}
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-emerald-300" />
                {t("contractorRepairProofLinked")}
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-emerald-300" />
                {t("warrantyStateVisible")}
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}

function fallbackEvents(report: CivicReport) {
  const events = [
    {
      label: "Citizen report created",
      detail: `${report.title} was submitted from ${report.location}.`,
      time: formatProofTime(report.createdAt),
      tx: report.evidenceHash ?? report.txHash,
    },
    {
      label: "AI verified civic issue",
      detail: `${report.issueCategory ?? "Infrastructure issue"} detected with ${report.confidence}% confidence.`,
      time: "AI audit",
      tx: report.evidenceHash ?? report.txHash,
    },
  ];

  if (report.status === "REPAIR_SUBMITTED" || report.status === "UNDER_WARRANTY" || report.status === "REPEAT_FAILURE" || report.status === "CLOSED") {
    events.push({
      label: "Repair proof submitted",
      detail: `${report.contractor} attached after-repair evidence for public audit.`,
      time: formatProofTime(report.repairProofAt),
      tx: report.repairTxHash ?? report.txHash,
    });
  }

  if (report.status === "UNDER_WARRANTY" || report.status === "REPEAT_FAILURE" || report.status === "CLOSED") {
    events.push({
      label: "Warranty activated",
      detail: `Warranty monitoring started for ${report.warrantyPeriodDays ?? 30} days.`,
      time: formatProofTime(report.warrantyActivatedAt),
      tx: report.repairTxHash ?? report.txHash,
    });
  }

  if (report.status === "REPEAT_FAILURE") {
    events.push({
      label: "Repeat failure detected",
      detail: "The same location failed again during the warranty window.",
      time: "Warranty scan",
      tx: report.txHash,
    });
  }

  if (report.status === "CLOSED") {
    events.push({
      label: "Issue closed by report issuer",
      detail: report.closureNote ?? "Repair accepted and moved from active map into public history.",
      time: formatProofTime(report.closedAt),
      tx: report.repairTxHash ?? report.txHash,
    });
  }

  return events;
}

function formatProofTime(value?: string) {
  if (!value) {
    return "Demo ledger";
  }

  return `${value.slice(0, 10)} ${value.slice(11, 16)} UTC`;
}

function warrantyLabel(report: CivicReport, t: (key: "pending" | "notActive" | "warranty") => string) {
  if (report.status === "CLOSED") {
    return "Closed";
  }

  if (report.status === "UNDER_WARRANTY" || report.status === "REPEAT_FAILURE") {
    return `${report.warrantyDaysLeft ?? report.warrantyPeriodDays ?? 90} ${t("warranty")}`;
  }

  if (report.status === "REPAIR_SUBMITTED") {
    return t("pending");
  }

  return t("notActive");
}

function statusCopy(
  status: CivicReport["status"],
  t: (key: "openIssues" | "pendingProof" | "repairSubmitted" | "active" | "repeatFailure") => string
) {
  const labels = {
    OPEN: t("openIssues"),
    PENDING_PROOF: t("pendingProof"),
    REPAIR_SUBMITTED: t("repairSubmitted"),
    UNDER_WARRANTY: t("active"),
    REPEAT_FAILURE: t("repeatFailure"),
    CLOSED: "Closed",
  };

  return labels[status];
}

function eventIcon(label: string) {
  if (label.toLowerCase().includes("closed")) {
    return CheckCircle2;
  }

  if (label.toLowerCase().includes("repair")) {
    return UserCheck;
  }

  if (label.toLowerCase().includes("warranty")) {
    return ShieldCheck;
  }

  if (label.toLowerCase().includes("repeat")) {
    return ShieldAlert;
  }

  if (label.toLowerCase().includes("ai")) {
    return Sparkles;
  }

  return FileImage;
}

function toneClass(index: number, total: number) {
  if (index === total - 1) {
    return "bg-[#00eb88]/15 text-[#5bffa1]";
  }

  const tones = [
    "bg-orange-500/15 text-orange-300",
    "bg-cyan-500/15 text-cyan-300",
    "bg-blue-500/15 text-blue-300",
    "bg-emerald-500/15 text-emerald-300",
  ];

  return tones[index % tones.length];
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/60 px-3 py-1.5 text-sm text-zinc-300">
      {icon}
      {label}
    </span>
  );
}

function Score({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-right text-sm font-semibold">{value}</span>
    </div>
  );
}

function MiniState({
  done,
  label,
  synced,
  pending,
}: {
  done: boolean;
  label: string;
  synced: string;
  pending: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <span className={done ? "text-emerald-300" : "text-orange-300"}>{done ? synced : pending}</span>
    </div>
  );
}

function EvidenceCard({
  label,
  status,
  tone,
  pattern,
  image,
}: {
  label: string;
  status: string;
  tone: "red" | "emerald" | "fuchsia" | "orange";
  pattern: "pothole" | "patch" | "failure";
  image?: string;
}) {
  const toneMap = {
    red: "border-red-400/20 bg-red-500/10 text-red-200",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    fuchsia: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200",
    orange: "border-orange-400/20 bg-orange-500/10 text-orange-200",
  };

  return (
    <div className={`overflow-hidden rounded-xl border ${toneMap[tone]}`}>
      <div className="relative h-56 bg-zinc-950">
        {image ? (
          <img src={image} alt={label} className="absolute inset-0 h-full w-full object-cover opacity-90" />
        ) : (
          <SyntheticEvidence pattern={pattern} />
        )}
      </div>

      <div className="p-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-zinc-400">{status}</p>
      </div>
    </div>
  );
}

function SyntheticEvidence({ pattern }: { pattern: "pothole" | "patch" | "failure" }) {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(113,113,122,0.35)_25%,transparent_25%),linear-gradient(225deg,rgba(113,113,122,0.35)_25%,transparent_25%),linear-gradient(45deg,rgba(63,63,70,0.35)_25%,transparent_25%),linear-gradient(315deg,rgba(63,63,70,0.35)_25%,#09090b_25%)] bg-[size:28px_28px] bg-[position:14px_0,14px_0,0_0,0_0]" />

      {pattern === "pothole" && (
        <div className="absolute left-1/2 top-1/2 h-20 w-36 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-red-300/40 bg-red-950 shadow-[0_0_40px_rgba(239,68,68,0.25)_inset]" />
      )}

      {pattern === "patch" && (
        <div className="absolute left-1/2 top-1/2 h-16 w-40 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-emerald-300/40 bg-emerald-950/80 shadow-[0_0_30px_rgba(16,185,129,0.18)_inset]" />
      )}

      {pattern === "failure" && (
        <>
          <div className="absolute left-1/2 top-1/2 h-16 w-40 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-emerald-300/20 bg-emerald-950/40" />
          <div className="absolute left-[48%] top-[52%] h-16 w-24 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-fuchsia-300/40 bg-fuchsia-950 shadow-[0_0_40px_rgba(217,70,239,0.25)_inset]" />
        </>
      )}
    </>
  );
}
