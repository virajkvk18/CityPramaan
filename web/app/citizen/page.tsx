/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  FileImage,
  Gauge,
  History,
  MapPin,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { LanguageSelector } from "@/src/components/layout/LanguageSelector";
import { NotificationBell } from "@/src/components/layout/NotificationBell";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { DEFAULT_CITY_KEY, getCityByKey } from "@/src/lib/city-context";
import { getCitySnapshot, subscribeCity } from "@/src/lib/city-storage";
import { getCurrentUser, getAuthSnapshot, roleLabels, subscribeAuth } from "@/src/lib/auth-storage";
import { getReportsForCity, type CivicReport } from "@/src/lib/mock-data";
import {
  appendReportEvent,
  getLocalReportsSnapshot,
  subscribeLocalReports,
} from "@/src/lib/report-storage";
import { mergeReportsById, saveReportEverywhere, watchBackendReports } from "@/src/lib/report-sync";
import { useDetectedLocationDisplay } from "@/src/lib/use-detected-location";

const statusCopy: Record<CivicReport["status"], string> = {
  OPEN: "Submitted",
  PENDING_PROOF: "Under review / awaiting contractor",
  ASSIGNED_TO_CONTRACTOR: "Assigned to contractor",
  WORK_ACCEPTED: "Contractor accepted work",
  WORK_STARTED: "Repair work started",
  WORK_COMPLETED: "Work completed",
  REPAIR_SUBMITTED: "Repair proof uploaded",
  ADMIN_APPROVED: "Admin approved / confirm work",
  REPAIR_REJECTED: "Repair proof rejected",
  CITIZEN_DISPUTED: "Citizen disputed",
  UNDER_WARRANTY: "Warranty active",
  REPEAT_FAILURE: "Reopened / warranty issue",
  CLOSED: "Closed",
};

const statusTone: Record<CivicReport["status"], string> = {
  OPEN: "border-[#ffb4ab]/35 bg-[#ffb4ab]/10 text-[#ffdad6]",
  PENDING_PROOF: "border-[#00dbe9]/35 bg-[#00dbe9]/10 text-[#7df4ff]",
  ASSIGNED_TO_CONTRACTOR: "border-[#00dbe9]/35 bg-[#00dbe9]/10 text-[#7df4ff]",
  WORK_ACCEPTED: "border-[#00dbe9]/35 bg-[#00dbe9]/10 text-[#7df4ff]",
  WORK_STARTED: "border-[#00dbe9]/35 bg-[#00dbe9]/10 text-[#7df4ff]",
  WORK_COMPLETED: "border-[#ffc08d]/35 bg-[#ffc08d]/10 text-[#ffdcc2]",
  REPAIR_SUBMITTED: "border-[#ffc08d]/35 bg-[#ffc08d]/10 text-[#ffdcc2]",
  ADMIN_APPROVED: "border-[#00eb88]/35 bg-[#00eb88]/10 text-[#5bffa1]",
  REPAIR_REJECTED: "border-[#ffb4ab]/35 bg-[#ffb4ab]/10 text-[#ffdad6]",
  CITIZEN_DISPUTED: "border-[#d946ef]/40 bg-[#d946ef]/12 text-[#f0abfc]",
  UNDER_WARRANTY: "border-[#00eb88]/35 bg-[#00eb88]/10 text-[#5bffa1]",
  REPEAT_FAILURE: "border-[#d946ef]/40 bg-[#d946ef]/12 text-[#f0abfc]",
  CLOSED: "border-white/15 bg-white/[0.05] text-[#dbc2b0]",
};

export default function CitizenDashboardPage() {
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => DEFAULT_CITY_KEY);
  const localReportsSnapshot = useSyncExternalStore(
    subscribeLocalReports,
    getLocalReportsSnapshot,
    () => "[]"
  );
  const authSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => "");
  const currentUser = useMemo(() => getCurrentUser(authSnapshot), [authSnapshot]);
  const selectedCity = getCityByKey(citySnapshot);
  const cityDisplay = useDetectedLocationDisplay(selectedCity);
  const [backendReports, setBackendReports] = useState<CivicReport[]>([]);
  const localReports = useMemo(
    () => JSON.parse(localReportsSnapshot) as CivicReport[],
    [localReportsSnapshot]
  );
  useEffect(() => {
    return watchBackendReports(selectedCity.key, setBackendReports);
  }, [selectedCity.key]);
  const citizenReports = useMemo(() => {
    const reports = mergeReportsById(
      getReportsForCity(selectedCity.key).slice(0, 2),
      backendReports,
      localReports
    ).filter((report) => !report.cityKey || report.cityKey === selectedCity.key);

    return reports.length
      ? reports.sort(sortLatest)
      : getReportsForCity(selectedCity.key).slice(0, 2).sort(sortLatest);
  }, [backendReports, localReports, selectedCity.key]);
  const [selectedReportId, setSelectedReportId] = useState(citizenReports[0]?.id ?? "");
  const selectedReport = citizenReports.find((report) => report.id === selectedReportId) ?? citizenReports[0];
  const activeCount = citizenReports.filter((report) => report.status !== "CLOSED").length;
  const proofPendingCount = citizenReports.filter((report) =>
    ["PENDING_PROOF", "REPAIR_SUBMITTED"].includes(report.status)
  ).length;

  function confirmWorkDone(report: CivicReport) {
    if (report.status !== "ADMIN_APPROVED") {
      return;
    }

    const now = new Date();
    const warrantyDays = report.warrantyPeriodDays ?? 90;
    const warrantyExpiresAt = new Date(now.getTime() + warrantyDays * 24 * 60 * 60 * 1000);
    const withClosure = appendReportEvent(
      {
        ...report,
        status: "CLOSED",
        ownerVerified: true,
        citizenFinalApproval: "CONFIRMED",
        warrantyStatus: "ACTIVE",
        warrantyDaysLeft: warrantyDays,
        warrantyPeriodDays: warrantyDays,
        warrantyActivatedAt: now.toISOString(),
        warrantyExpiresAt: warrantyExpiresAt.toISOString(),
        closedAt: now.toISOString(),
        closureNote: "Citizen confirmed the repair after Ward Admin approval. Warranty activated automatically.",
      },
      {
        label: "Citizen confirmed work done",
        detail: "The issue owner verified contractor proof and confirmed that the repair is actually completed.",
        time: now.toLocaleString(),
        tx: `0xcitizen...${report.id.replace("CP-", "")}`,
      }
    );
    const updated = appendReportEvent(withClosure, {
      label: "Report closed and warranty activated",
      detail: `${warrantyDays}-day warranty started after citizen confirmation. Public proof remains visible as permanent history.`,
      time: now.toLocaleString(),
      tx: `0xwarranty...${report.id.replace("CP-", "")}`,
    });

    void saveReportEverywhere(updated);
  }

  function disputeRepair(report: CivicReport) {
    if (report.status !== "ADMIN_APPROVED") {
      return;
    }

    const now = new Date();
    const updated = appendReportEvent(
      {
        ...report,
        status: "CITIZEN_DISPUTED",
        citizenFinalApproval: "DISPUTED",
        warrantyStatus: "NOT_ACTIVE",
        ownerVerified: false,
        recommendedAction: "Citizen disputed the repair. Ward Admin must review the contractor proof again.",
      },
      {
        label: "Citizen disputed repair proof",
        detail: "The issue owner says the problem is not actually fixed. Ward Admin review is required again.",
        time: now.toLocaleString(),
        tx: `0xdispute...${report.id.replace("CP-", "")}`,
      }
    );

    void saveReportEverywhere(updated);
  }

  function reopenWarrantyIssue(report: CivicReport) {
    if (!["UNDER_WARRANTY", "CLOSED", "REPEAT_FAILURE"].includes(report.status)) {
      return;
    }

    const now = new Date();
    const updated = appendReportEvent(
      {
        ...report,
        status: "REPEAT_FAILURE",
        warrantyDaysLeft: report.warrantyDaysLeft ?? report.warrantyPeriodDays ?? 90,
        updatedAt: now.toISOString(),
      },
      {
        label: "Citizen reopened warranty issue",
        detail:
          "Citizen reported that the same problem appeared again after repair. Ward admin must re-audit this location.",
        time: now.toLocaleString(),
        tx: `0xreopen...${report.id.replace("CP-", "")}`,
      }
    );

    void saveReportEverywhere(updated);
  }

  return (
    <main className="cp-page-shell relative min-h-screen overflow-hidden bg-[#050505] text-[#e5e2e3]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,153,51,0.14),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(0,219,233,0.14),transparent_26%),radial-gradient(circle_at_48%_94%,rgba(0,235,136,0.08),transparent_30%)]" />
      <div className="bg-holo-grid pointer-events-none fixed inset-0" />
      <div className="stitch-cityline pointer-events-none fixed bottom-0 left-0 right-0 h-44 opacity-20" />

      <header className="fixed top-0 z-50 flex min-h-16 w-full flex-wrap items-center justify-between gap-3 border-b border-[#ff9933]/15 bg-[#030507]/78 px-3 py-3 shadow-[0_0_30px_rgba(0,219,233,0.08)] backdrop-blur-xl md:h-16 md:flex-nowrap md:px-8 md:py-0">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Link
            href="/"
            className="grid h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0] transition hover:border-[#00dbe9]/60 hover:text-[#00dbe9]"
            aria-label="Back to command center"
          >
            <ArrowLeft size={17} />
          </Link>
          <BrandLogo size="sm" subtitle="Citizen Console" />
        </div>
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <NotificationBell />
          <LanguageSelector compact />
          <ThemeToggle />
        </div>
      </header>

      <section className="relative z-10 px-4 pb-24 pt-24 md:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6 flex flex-col justify-between gap-5 border-b border-white/5 pb-5 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#00dbe9]">
                {currentUser ? roleLabels[currentUser.role] : "Citizen access"} | {cityDisplay.cityName}
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black uppercase leading-[0.94] tracking-tight text-white sm:text-6xl">
                My civic reports
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[#dbc2b0] sm:text-base">
                Create a civic issue, track its status, see the assigned contractor, and verify the
                public proof timeline after repair. No admin approval controls are shown here.
              </p>
            </div>
            <Link
              href="/report"
              className="btn-primary-shimmer inline-flex items-center justify-center rounded bg-[#ffc08d] px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#4c2700]"
            >
              Create New Report
            </Link>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={<Gauge size={18} />} label="My active reports" value={String(activeCount)} tone="gold" />
            <StatCard icon={<Clock3 size={18} />} label="Pending proof" value={String(proofPendingCount)} tone="cyan" />
            <StatCard icon={<ShieldCheck size={18} />} label="Warranty watch" value="Ready" tone="green" />
            <StatCard icon={<History size={18} />} label="Proof events" value={String(citizenReports.length * 2)} tone="violet" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
            <section className="cp-cyber-card rounded-xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#ffc08d]">
                  Submitted reports
                </h2>
                <span className="rounded border border-white/10 bg-black/35 px-2 py-1 font-mono text-[10px] text-[#dbc2b0]">
                  {citizenReports.length} records
                </span>
              </div>
              <div className="space-y-3">
                {citizenReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`w-full rounded-lg border p-4 text-left transition ${
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
                      <StatusBadge status={report.status} />
                    </div>
                    <p className="mt-2 flex items-start gap-2 text-xs text-[#dbc2b0]/70">
                      <MapPin size={13} className="mt-0.5 shrink-0" />
                      {report.location}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            {selectedReport ? (
              <section className="space-y-6">
                <article className="cp-cyber-card cp-cyber-card-hover rounded-xl p-6">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div>
                      <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#00dbe9]">
                        {selectedReport.id} | Citizen tracking
                      </p>
                      <h2 className="mt-2 text-3xl font-black text-white">{selectedReport.title}</h2>
                      <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-[#dbc2b0]">
                        <MapPin size={16} className="mt-1 shrink-0 text-[#ffc08d]" />
                        {selectedReport.location}
                      </p>
                    </div>
                    <StatusBadge status={selectedReport.status} />
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <Info label="Current status" value={statusCopy[selectedReport.status]} />
                    <Info label="Assigned contractor" value={selectedReport.contractor} />
                    <Info label="Severity" value={selectedReport.severity} />
                    <Info label="AI confidence" value={`${selectedReport.confidence}%`} />
                    <Info label="SLA" value={selectedReport.slaHours ? `${selectedReport.slaHours} hrs` : "Pending"} />
                    <Info label="Proof hash" value={shortHash(selectedReport.proofBundleHash)} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/proof/${selectedReport.id}`}
                      className="inline-flex items-center gap-2 rounded border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-4 py-3 font-mono text-xs font-bold uppercase text-[#7df4ff] transition hover:bg-[#00dbe9]/15"
                    >
                      <FileImage size={15} />
                      Public proof
                    </Link>
                    <Link
                      href={`/warranty?issue=${selectedReport.id}#issue-progress`}
                      className="inline-flex items-center gap-2 rounded border border-[#ffc08d]/35 bg-[#ffc08d]/10 px-4 py-3 font-mono text-xs font-bold uppercase text-[#ffdcc2] transition hover:bg-[#ffc08d]/15"
                    >
                      <Clock3 size={15} />
                      Track progress
                    </Link>
                    <button
                      type="button"
                      onClick={() => reopenWarrantyIssue(selectedReport)}
                      disabled={!["UNDER_WARRANTY", "CLOSED", "REPEAT_FAILURE"].includes(selectedReport.status)}
                      className="inline-flex items-center gap-2 rounded border border-[#d946ef]/35 bg-[#d946ef]/10 px-4 py-3 font-mono text-xs font-bold uppercase text-[#f0abfc] transition hover:bg-[#d946ef]/15 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <RotateCcw size={15} />
                      Reopen warranty issue
                    </button>
                  </div>

                  {selectedReport.status === "ADMIN_APPROVED" && (
                    <div className="mt-5 rounded border border-[#00eb88]/25 bg-[#00eb88]/10 p-4">
                      <p className="font-semibold text-[#d3fbff]">
                        Ward Admin approved the repair proof. Please confirm only if the work is actually done.
                      </p>
                      {selectedReport.repairImageDataUrl && (
                        <img
                          src={selectedReport.repairImageDataUrl}
                          alt="Contractor repair proof"
                          className="mt-4 h-48 w-full rounded border border-white/10 object-cover"
                        />
                      )}
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => confirmWorkDone(selectedReport)}
                          className="rounded bg-[#00eb88] px-4 py-3 font-mono text-xs font-bold uppercase text-[#00210e]"
                        >
                          Confirm Work Done
                        </button>
                        <button
                          type="button"
                          onClick={() => disputeRepair(selectedReport)}
                          className="rounded border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 px-4 py-3 font-mono text-xs font-bold uppercase text-[#ffdad6]"
                        >
                          Raise Concern
                        </button>
                      </div>
                    </div>
                  )}
                </article>

                <article className="cp-cyber-card rounded-xl p-6">
                  <h3 className="mb-5 flex items-center gap-2 border-b border-white/5 pb-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#d3fbff]">
                    <BadgeCheck size={15} />
                    Public proof timeline
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
                </article>
              </section>
            ) : (
              <section className="cp-cyber-card rounded-xl p-8 text-center">
                <p className="text-xl font-semibold text-white">No reports yet.</p>
                <Link href="/report" className="mt-4 inline-flex rounded bg-[#ffc08d] px-5 py-3 font-semibold text-[#4c2700]">
                  Create your first report
                </Link>
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: CivicReport["status"] }) {
  return (
    <span className={`shrink-0 rounded border px-2 py-1 font-mono text-[10px] font-bold uppercase ${statusTone[status]}`}>
      {statusCopy[status]}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "cyan" | "gold" | "green" | "violet";
}) {
  const toneClass = {
    cyan: "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#7df4ff]",
    gold: "border-[#ffc08d]/30 bg-[#ffc08d]/10 text-[#ffdcc2]",
    green: "border-[#00eb88]/30 bg-[#00eb88]/10 text-[#5bffa1]",
    violet: "border-[#d946ef]/30 bg-[#d946ef]/10 text-[#f0abfc]",
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-lg border border-current/25 bg-black/25">
          {icon}
        </div>
        <span className="h-2 w-2 rounded-full bg-current shadow-[0_0_18px_currentColor]" />
      </div>
      <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.16em] opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded border border-white/10 bg-black/35 p-3">
      <p className="font-mono text-[10px] uppercase text-[#dbc2b0]/60">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-semibold text-white">{value ?? "Pending"}</p>
    </div>
  );
}

function TimelineNode({
  title,
  date,
  detail,
  active,
}: {
  title: string;
  date: string;
  detail: string;
  active?: boolean;
}) {
  return (
    <div className="relative">
      <span
        className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-[#050505] ${
          active ? "bg-[#ffc08d] shadow-[0_0_12px_rgba(255,192,141,0.75)]" : "bg-[#00eb88]"
        }`}
      />
      <p className="font-mono text-xs text-[#a38d7c]">{date}</p>
      <p className="mt-1 font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[#dbc2b0]">{detail}</p>
    </div>
  );
}

function fallbackHistory(report: CivicReport) {
  return [
    {
      label: "Citizen submitted report",
      detail: `${report.title} submitted from ${report.location}.`,
      time: report.createdAt ? new Date(report.createdAt).toLocaleString() : "Recently",
    },
    {
      label: "Awaiting civic workflow update",
      detail: statusCopy[report.status],
      time: report.updatedAt ? new Date(report.updatedAt).toLocaleString() : "Pending",
    },
  ];
}

function sortLatest(first: CivicReport, second: CivicReport) {
  return getTime(second) - getTime(first);
}

function getTime(report: CivicReport) {
  return new Date(report.updatedAt ?? report.createdAt ?? 0).getTime();
}

function shortHash(value?: string) {
  if (!value) {
    return "Pending";
  }

  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value;
}
