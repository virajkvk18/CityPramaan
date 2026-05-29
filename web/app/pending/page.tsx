/* eslint-disable @next/next/no-img-element */
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  Camera,
  ExternalLink,
  LayoutDashboard,
  MapPin,
  ScanSearch,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { LanguageSelector } from "@/src/components/layout/LanguageSelector";
import { NotificationBell } from "@/src/components/layout/NotificationBell";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { DEFAULT_CITY_KEY, demoCities, getCityByKey, type CityKey } from "@/src/lib/city-context";
import { getCitySnapshot, setSelectedCityKey, subscribeCity } from "@/src/lib/city-storage";
import { getReportsForCity, type CivicReport } from "@/src/lib/mock-data";
import {
  appendReportEvent,
  getLocalReportsSnapshot,
  subscribeLocalReports,
  upsertLocalReport,
} from "@/src/lib/report-storage";
import { useLanguage } from "@/src/lib/use-language";
import { useDetectedLocationDisplay } from "@/src/lib/use-detected-location";

const reviewStatuses: CivicReport["status"][] = [
  "OPEN",
  "PENDING_PROOF",
  "REPAIR_SUBMITTED",
  "UNDER_WARRANTY",
  "REPEAT_FAILURE",
  "CLOSED",
];

export default function PendingApprovalPage() {
  const { t } = useLanguage();
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => DEFAULT_CITY_KEY);
  const localReportsSnapshot = useSyncExternalStore(
    subscribeLocalReports,
    getLocalReportsSnapshot,
    () => "[]"
  );
  const selectedCity = getCityByKey(citySnapshot);
  const cityDisplay = useDetectedLocationDisplay(selectedCity);
  const localReports = useMemo(
    () => JSON.parse(localReportsSnapshot) as CivicReport[],
    [localReportsSnapshot]
  );
  const allReports = useMemo(() => {
    const localForCity = localReports.filter((report) => !report.cityKey || report.cityKey === selectedCity.key);
    const localIds = new Set(localForCity.map((report) => report.id));
    return [...localForCity, ...getReportsForCity(selectedCity.key).filter((report) => !localIds.has(report.id))];
  }, [localReports, selectedCity.key]);
  const reviewReports = allReports
    .filter((report) => reviewStatuses.includes(report.status))
    .sort(sortReviewReports);
  const pendingCount = reviewReports.filter((report) => report.status === "REPAIR_SUBMITTED").length;
  const [selectedReportId, setSelectedReportId] = useState(
    reviewReports.find((report) => report.status === "REPAIR_SUBMITTED")?.id ?? reviewReports[0]?.id ?? ""
  );
  const [actionMessage, setActionMessage] = useState("");
  const selectedReport =
    reviewReports.find((report) => report.id === selectedReportId) ??
    reviewReports.find((report) => report.status === "REPAIR_SUBMITTED") ??
    reviewReports[0];
  const hasRepairProof = Boolean(selectedReport?.repairImageDataUrl || selectedReport?.repairImageName);

  function approveRepairAndActivateWarranty(report: CivicReport) {
    if (report.status !== "REPAIR_SUBMITTED") {
      setActionMessage("Only contractor proofs with Repair Submitted status can be approved.");
      return;
    }

    if (!report.repairImageDataUrl && !report.repairImageName) {
      setActionMessage("Contractor repair proof is required before warranty activation.");
      return;
    }

    const now = new Date();
    const isPowerOutage = report.issueCategory === "POWER_OUTAGE";
    const warrantyDays = 90;
    const warrantyExpiresAt = new Date(now.getTime() + warrantyDays * 24 * 60 * 60 * 1000);
    const updated = appendReportEvent(
      {
        ...report,
        cityKey: report.cityKey ?? selectedCity.key,
        status: "UNDER_WARRANTY",
        warrantyDaysLeft: warrantyDays,
        warrantyPeriodDays: warrantyDays,
        warrantyActivatedAt: now.toISOString(),
        warrantyExpiresAt: warrantyExpiresAt.toISOString(),
        utilityRestoration: report.utilityRestoration
          ? {
              ...report.utilityRestoration,
              estimatedRestoration: "Restored",
              progressStage: "Power restored",
              citizenUpdate:
                "Power restoration has been approved by the issuer. Public monitoring remains active for repeat outage reports.",
            }
          : undefined,
      },
      {
        label: isPowerOutage ? "Power restored and approved by issuer" : "Repair approved by report issuer",
        detail: isPowerOutage
          ? `${warrantyDays}-day restoration monitoring activated after issuer reviewed utility proof and public status update.`
          : `${warrantyDays}-day warranty activated after issuer reviewed contractor proof and AI audit.`,
        time: now.toLocaleString(),
        tx: `0xb928...${report.id.replace("CP-", "")}ce`,
      }
    );

    upsertLocalReport(updated);
    setActionMessage(`${report.id} approved. Warranty is now active and visible in Warranty Scanner.`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#e5e2e3]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,153,51,0.16),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(0,219,233,0.14),transparent_28%),radial-gradient(circle_at_48%_94%,rgba(0,235,136,0.08),transparent_30%)]" />
      <div className="bg-holo-grid pointer-events-none fixed inset-0" />
      <div className="stitch-cityline pointer-events-none fixed bottom-0 left-0 right-0 h-44 opacity-20" />

      <header className="fixed top-0 z-50 flex min-h-16 w-full flex-wrap items-center justify-between gap-3 border-b border-[#ff9933]/15 bg-[#030507]/75 px-3 py-3 shadow-[0_0_30px_rgba(0,219,233,0.08)] backdrop-blur-xl md:h-16 md:flex-nowrap md:px-8 md:py-0">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Link
            href="/"
            className="grid h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0] transition hover:border-[#00dbe9]/60 hover:text-[#00dbe9]"
            aria-label={t("backToCommandCenter")}
          >
            <ArrowLeft size={17} />
          </Link>
          <BrandLogo size="sm" subtitle="Pending Approval" />
        </div>
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <NotificationBell />
          <button className="hidden h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0]/70 transition hover:text-[#00eb88] sm:grid">
            <Settings size={16} />
          </button>
          <ThemeToggle />
          <LanguageSelector compact />
        </div>
      </header>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[#ff9933]/15 bg-[linear-gradient(180deg,rgba(255,153,51,0.08),rgba(0,0,0,0.5)_22%,rgba(0,219,233,0.045))] px-4 pb-5 pt-20 shadow-[5px_0_24px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:flex">
        <div className="mt-2 border-b border-white/10 px-2 pb-5">
          <BrandLogo size="sm" subtitle="Issuer Review" />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label={t("commandCenter")} />
          <NavItem href="/pending" icon={<ScanSearch size={18} />} label={t("pendingProof")} active />
          <NavItem href="/contractor" icon={<BadgeCheck size={18} />} label={t("contractorView")} />
          <NavItem href="/warranty" icon={<Wallet size={18} />} label={t("warrantyScanner")} />
          <NavItem href="/report" icon={<Camera size={18} />} label={t("reportIssue")} />
        </nav>
      </aside>

      <section className="relative z-10 min-h-screen px-4 pb-10 pt-24 md:ml-64 md:px-8 md:pt-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-7 flex flex-col justify-between gap-4 border-b border-white/5 pb-4 lg:flex-row lg:items-end">
            <div>
              <Link href="/" className="hidden">
                <ArrowLeft size={16} />
                {t("backToCommandCenter")}
              </Link>
              <p className="font-mono text-xs uppercase text-[#00dbe9]">Issuer Review Queue</p>
              <h1 className="mt-2 text-3xl font-semibold text-white sm:text-5xl">Pending Approval</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#dbc2b0]">
                Review citizen report history, contractor proof, AI before/after stats, and approve only
                when the repair looks solved. Approval activates warranty and syncs the public proof.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-3 py-2 text-[#7df4ff]">
                <MapPin size={15} />
                <select
                  value={selectedCity.key}
                  onChange={(event) => {
                    setSelectedCityKey(event.target.value as CityKey);
                    setSelectedReportId("");
                  }}
                  className="bg-transparent font-mono text-xs font-bold uppercase text-[#7df4ff] outline-none"
                >
                  {demoCities.map((city) => (
                    <option key={city.key} value={city.key} className="bg-[#050505] text-white">
                      {cityDisplay.isDetectedForSelected && city.key === selectedCity.key
                        ? `${cityDisplay.cityName} GPS`
                        : city.name}
                    </option>
                  ))}
                </select>
              </label>
              <Stat label="Awaiting approval" value={String(pendingCount).padStart(2, "0")} tone="amber" />
              <Stat label="Total history" value={String(reviewReports.length).padStart(2, "0")} tone="cyan" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-5 xl:col-span-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-mono text-xs uppercase text-[#ffc08d]">Report history</h2>
                <span className="rounded border border-white/10 bg-black/35 px-2 py-1 font-mono text-[10px] text-[#dbc2b0]">
                  {cityDisplay.cityName}
                </span>
              </div>

              <div className="space-y-3">
                {reviewReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`w-full rounded border p-4 text-left transition ${
                      selectedReport?.id === report.id
                        ? "border-[#ffc08d]/60 bg-[#ffc08d]/10"
                        : "border-white/10 bg-black/25 hover:border-[#00dbe9]/35"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-[#00dbe9]">{report.id}</p>
                        <p className="mt-1 font-semibold text-white">{report.title}</p>
                      </div>
                      <StatusBadge report={report} />
                    </div>
                    <p className="mt-2 text-xs text-[#dbc2b0]/70">{report.location}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-6 xl:col-span-8">
              {selectedReport ? (
                <>
                  <div className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                    <div className="mb-5 flex flex-col justify-between gap-4 border-b border-white/5 pb-4 lg:flex-row lg:items-start">
                      <div>
                        <p className="font-mono text-xs uppercase text-[#00dbe9]">{selectedReport.id} | Issuer decision</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">{selectedReport.title}</h2>
                        <p className="mt-2 flex items-center gap-2 text-sm text-[#dbc2b0]">
                          <MapPin size={15} />
                          {selectedReport.location}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-80">
                        <Info label={t("status")} value={statusCopy(selectedReport)} />
                        <Info label={t("severity")} value={selectedReport.severity} />
                        <Info label={t("aiConfidence")} value={`${selectedReport.confidence}%`} />
                        <Info label={t("contractor")} value={selectedReport.contractor} />
                        <Info label="AI priority" value={selectedReport.aiPriorityScore ? `${selectedReport.aiPriorityScore}/100` : "Pending"} />
                        <Info label="Proof hash" value={selectedReport.proofBundleHash ?? selectedReport.evidenceHash ?? selectedReport.txHash} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <EvidencePanel
                        label={t("issueBefore")}
                        image={selectedReport.issueImageDataUrl}
                        fallback="Citizen issue evidence"
                        tone="rose"
                      />
                      <EvidencePanel
                        label={t("contractorProofAfter")}
                        image={selectedReport.repairImageDataUrl}
                        fallback={selectedReport.repairImageName ?? t("noRepairProofYet")}
                        tone={hasRepairProof ? "emerald" : "amber"}
                      />
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <Info label="Before / after delta" value={selectedReport.repairAudit?.beforeAfterDelta ?? "Pending"} />
                      <Info label={t("repairIntegrity")} value={selectedReport.repairAudit?.repairIntegrity ?? "Pending"} />
                      <Info label={t("geoMatch")} value={selectedReport.repairAudit?.geoVariance ?? "Pending"} />
                      <Info label="Repair evidence hash" value={selectedReport.repairEvidenceHash ?? selectedReport.repairTxHash ?? "Pending"} />
                    </div>

                    <div className="mt-5 rounded border border-[#00dbe9]/20 bg-[#00dbe9]/10 p-4 text-sm leading-6 text-[#d3fbff]">
                      {selectedReport.repairAudit?.recommendation ??
                        selectedReport.recommendedAction ??
                        "Waiting for contractor proof before approval."}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => approveRepairAndActivateWarranty(selectedReport)}
                        disabled={selectedReport.status !== "REPAIR_SUBMITTED" || !hasRepairProof}
                        className="btn-primary-shimmer flex flex-1 items-center justify-center gap-2 rounded bg-[#ffc08d] px-4 py-3 font-mono text-xs font-semibold text-[#4c2700] transition disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <ShieldCheck size={16} />
                        Approve Repair & Activate Warranty
                      </button>
                      <Link
                        href={`/proof/${selectedReport.id}`}
                        className="flex flex-1 items-center justify-center gap-2 rounded border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-4 py-3 text-sm font-semibold text-[#7df4ff] transition hover:bg-[#00dbe9]/15"
                      >
                        Open Public Proof
                        <ExternalLink size={15} />
                      </Link>
                    </div>

                    {actionMessage && (
                      <p className="mt-4 rounded border border-[#ffc08d]/20 bg-[#ffc08d]/10 px-3 py-2 text-sm text-[#ffdcc2]">
                        {actionMessage}
                      </p>
                    )}
                  </div>

                  <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                    <h3 className="mb-5 flex items-center gap-2 border-b border-white/5 pb-3 font-mono text-xs uppercase text-[#d3fbff]">
                      <CalendarClock size={15} />
                      Report timeline
                    </h3>
                    <div className="relative flex flex-col gap-6 border-l border-white/10 pl-6">
                      {(selectedReport.history?.length ? selectedReport.history : fallbackHistory(selectedReport)).map((event, index) => (
                        <TimelineNode
                          key={`${event.label}-${index}`}
                          title={event.label}
                          date={event.time}
                          detail={event.detail}
                          active={index === (selectedReport.history?.length ?? 0) - 1}
                        />
                      ))}
                    </div>
                  </section>
                </>
              ) : (
                <div className="cp-cyber-card rounded-lg p-8 text-center">
                  <p className="text-xl font-semibold text-white">No pending approval history yet.</p>
                  <Link href="/report" className="mt-4 inline-flex rounded bg-[#ffc08d] px-5 py-3 font-semibold text-[#4c2700]">
                    {t("reportIssue")}
                  </Link>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function NavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded px-4 py-3 transition ${
        active
          ? "border-r-2 border-[#ffc08d] bg-[#ffc08d]/10 text-[#ffc08d] shadow-[inset_0_0_12px_rgba(255,183,122,0.18)]"
          : "text-[#dbc2b0]/60 hover:bg-white/[0.04] hover:text-[#d3fbff]"
      } font-mono text-xs`}
    >
      {icon}
      {label}
    </Link>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "amber" | "cyan" }) {
  const color = tone === "amber" ? "text-[#ffc08d]" : "text-[#00dbe9]";

  return (
    <div className="rounded border border-white/10 bg-black/35 px-4 py-2">
      <p className="font-mono text-[10px] uppercase text-[#dbc2b0]/60">{label}</p>
      <p className={`mt-1 font-mono text-xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/35 p-3">
      <p className="font-mono text-[10px] uppercase text-[#dbc2b0]/60">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ report }: { report: CivicReport }) {
  const tones = {
    OPEN: "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]",
    PENDING_PROOF: "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#7df4ff]",
    REPAIR_SUBMITTED: "border-[#ffc08d]/30 bg-[#ffc08d]/10 text-[#ffc08d]",
    UNDER_WARRANTY: "border-[#00eb88]/30 bg-[#00eb88]/10 text-[#00eb88]",
    REPEAT_FAILURE: "border-[#d946ef]/30 bg-[#d946ef]/10 text-[#f0abfc]",
    CLOSED: "border-[#00eb88]/30 bg-[#00eb88]/10 text-[#00eb88]",
  };

  return (
    <span className={`shrink-0 rounded border px-2 py-1 font-mono text-[10px] uppercase ${tones[report.status]}`}>
      {statusCopy(report)}
    </span>
  );
}

function statusCopy(report: CivicReport) {
  const labels = {
    OPEN: "Open",
    PENDING_PROOF: "Awaiting contractor",
    REPAIR_SUBMITTED: "Pending approval",
    UNDER_WARRANTY: "Warranty active",
    REPEAT_FAILURE: "Repeat failure",
    CLOSED: "Closed",
  };

  return labels[report.status];
}

function sortReviewReports(a: CivicReport, b: CivicReport) {
  const priority = (report: CivicReport) => {
    if (report.status === "REPAIR_SUBMITTED" && (report.repairImageDataUrl || report.repairImageName)) {
      return 0;
    }

    if (report.status === "REPAIR_SUBMITTED") {
      return 1;
    }

    if (report.status === "PENDING_PROOF" || report.status === "OPEN") {
      return 2;
    }

    if (report.status === "UNDER_WARRANTY" || report.status === "REPEAT_FAILURE") {
      return 3;
    }

    return 4;
  };

  const time = (report: CivicReport) =>
    Date.parse(report.repairProofAt ?? report.updatedAt ?? report.createdAt ?? "") || 0;

  return priority(a) - priority(b) || time(b) - time(a) || a.id.localeCompare(b.id);
}

function EvidencePanel({
  label,
  image,
  fallback,
  tone,
}: {
  label: string;
  image?: string;
  fallback: string;
  tone: "rose" | "emerald" | "amber";
}) {
  const colors = {
    rose: "border-[#ffb4ab]/35 text-[#ffb4ab]",
    emerald: "border-[#00eb88]/35 text-[#00eb88]",
    amber: "border-[#ffc08d]/35 text-[#ffc08d]",
  };

  return (
    <div>
      <div className={`relative h-72 overflow-hidden rounded border bg-black ${colors[tone]}`}>
        <span className={`absolute left-2 top-2 z-20 rounded border bg-black/80 px-2 py-1 font-mono text-[10px] ${colors[tone]}`}>
          {label}
        </span>
        {image ? (
          <img src={image} alt={label} className="absolute inset-0 h-full w-full object-cover opacity-85" />
        ) : (
          <>
            <div className="absolute inset-0 evidence-asphalt opacity-80" />
            <div className="cp-road-crater absolute left-1/2 top-1/2 h-20 w-36 -translate-x-1/2 -translate-y-1/2 border border-current bg-black/50" />
          </>
        )}
        <div className="absolute inset-0 bg-black/25" />
      </div>
      <p className="mt-2 text-xs text-[#dbc2b0]/70">{fallback}</p>
    </div>
  );
}

function fallbackHistory(report: CivicReport) {
  return [
    {
      label: "Citizen report created",
      detail: `${report.title} submitted from ${report.location}.`,
      time: "Demo timeline",
    },
    {
      label: report.status === "REPAIR_SUBMITTED" ? "Contractor proof pending approval" : "Awaiting contractor proof",
      detail:
        report.status === "REPAIR_SUBMITTED"
          ? "Issuer needs to review the proof and activate warranty."
          : "No contractor repair proof has been submitted yet.",
      time: "Demo timeline",
    },
  ];
}

function TimelineNode({
  title,
  date,
  detail,
  active = false,
}: {
  title: string;
  date: string;
  detail: string;
  active?: boolean;
}) {
  return (
    <div className="relative">
      <span
        className={`absolute -left-[33px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-[#00eb88] bg-black ${
          active ? "shadow-[0_0_12px_rgba(0,235,136,0.6)]" : ""
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#00eb88]" />
      </span>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <span className="font-mono text-xs text-[#dbc2b0]/55">{date}</span>
        </div>
        <p className="max-w-2xl text-xs leading-5 text-[#dbc2b0]/75">{detail}</p>
      </div>
    </div>
  );
}
