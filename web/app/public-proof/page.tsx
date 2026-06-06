"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  DatabaseZap,
  FileText,
  Filter,
  Hash,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { LanguageSelector } from "@/src/components/layout/LanguageSelector";
import { LocationDetectButton } from "@/src/components/layout/LocationDetectButton";
import { NotificationBell } from "@/src/components/layout/NotificationBell";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { DEFAULT_CITY_KEY, demoCities, getCityByKey, type CityKey } from "@/src/lib/city-context";
import { getCitySnapshot, subscribeCity } from "@/src/lib/city-storage";
import { getReportsForCity, type CivicReport, type ReportStatus } from "@/src/lib/mock-data";
import { getLocalReportsSnapshot, subscribeLocalReports } from "@/src/lib/report-storage";
import { fetchBackendReports, mergeReportsById } from "@/src/lib/report-sync";
import { useDetectedLocationDisplay } from "@/src/lib/use-detected-location";

const statusLabels: Record<ReportStatus, string> = {
  OPEN: "Open",
  PENDING_PROOF: "Pending Proof",
  ASSIGNED_TO_CONTRACTOR: "Assigned",
  WORK_ACCEPTED: "Work Accepted",
  WORK_STARTED: "Work Started",
  WORK_COMPLETED: "Work Completed",
  REPAIR_SUBMITTED: "Repair Submitted",
  ADMIN_APPROVED: "Admin Approved",
  REPAIR_REJECTED: "Repair Rejected",
  CITIZEN_DISPUTED: "Citizen Disputed",
  UNDER_WARRANTY: "Warranty Active",
  REPEAT_FAILURE: "Repeat Failure",
  CLOSED: "Closed",
};

const statusTone: Record<ReportStatus, string> = {
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

const statusOptions: Array<"ALL" | ReportStatus> = [
  "ALL",
  "OPEN",
  "PENDING_PROOF",
  "ASSIGNED_TO_CONTRACTOR",
  "WORK_STARTED",
  "REPAIR_SUBMITTED",
  "ADMIN_APPROVED",
  "UNDER_WARRANTY",
  "REPEAT_FAILURE",
  "CLOSED",
];

export default function PublicProofPage() {
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => DEFAULT_CITY_KEY);
  const localReportsSnapshot = useSyncExternalStore(
    subscribeLocalReports,
    getLocalReportsSnapshot,
    () => "[]"
  );
  const selectedCity = getCityByKey(citySnapshot);
  const cityDisplay = useDetectedLocationDisplay(selectedCity);
  const [backendReports, setBackendReports] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReportStatus>("ALL");
  const [cityFilter, setCityFilter] = useState<"CURRENT" | CityKey>("CURRENT");

  const localReports = useMemo(
    () => JSON.parse(localReportsSnapshot) as CivicReport[],
    [localReportsSnapshot]
  );

  useEffect(() => {
    let active = true;

    async function loadReports() {
      const reports = await fetchBackendReports();

      if (active) {
        setBackendReports(reports);
        setLoading(false);
      }
    }

    void loadReports();

    return () => {
      active = false;
    };
  }, []);

  const allReports = useMemo(() => {
    return mergeReportsById(getReportsForCity(selectedCity.key), backendReports, localReports).sort(sortLatestFirst);
  }, [backendReports, localReports, selectedCity.key]);

  const filteredReports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const effectiveCityFilter = cityFilter === "CURRENT" ? selectedCity.key : cityFilter;

    return allReports.filter((report) => {
      const matchesCity = report.cityKey === effectiveCityFilter;
      const matchesStatus = statusFilter === "ALL" || report.status === statusFilter;
      const searchable = [
        report.id,
        report.title,
        report.location,
        report.status,
        report.severity,
        report.issueCategory,
        report.contractor,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCity && matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [allReports, cityFilter, query, selectedCity.key, statusFilter]);

  const latestReport = filteredReports[0] ?? allReports.find((report) => report.cityKey === selectedCity.key);
  const summary = useMemo(
    () => ({
      total: filteredReports.length,
      pending: filteredReports.filter((report) => report.status === "PENDING_PROOF").length,
      warranty: filteredReports.filter((report) => report.status === "UNDER_WARRANTY" || report.warrantyStatus === "ACTIVE").length,
      critical: filteredReports.filter((report) => report.severity === "Critical").length,
    }),
    [filteredReports]
  );

  return (
    <main className="cp-page-shell cp-public-reports-page relative min-h-screen overflow-hidden bg-[#050505] text-[#e5e2e3]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,153,51,0.14),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(0,219,233,0.14),transparent_26%),radial-gradient(circle_at_48%_94%,rgba(0,235,136,0.08),transparent_30%)]" />
      <div className="bg-holo-grid pointer-events-none fixed inset-0" />
      <div className="stitch-cityline pointer-events-none fixed bottom-0 left-0 right-0 h-44 opacity-20" />

      <header className="cp-public-reports-header fixed top-0 z-50 flex min-h-16 w-full flex-wrap items-center justify-between gap-3 border-b border-[#ff9933]/15 bg-[#030507]/78 px-3 py-3 shadow-[0_0_30px_rgba(0,219,233,0.08)] backdrop-blur-xl md:h-16 md:flex-nowrap md:px-8 md:py-0">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Link
            href="/"
            className="grid h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0] transition hover:border-[#00dbe9]/60 hover:text-[#00dbe9]"
            aria-label="Back to command center"
          >
            <ArrowLeft size={17} />
          </Link>
          <BrandLogo size="sm" subtitle="Public Proof Board" />
        </div>
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <NotificationBell />
          <LanguageSelector compact />
          <ThemeToggle />
        </div>
      </header>

      <section className="cp-public-reports-content relative z-10 px-4 pb-10 pt-24 md:px-8 md:pt-24">
        <div className="mx-auto max-w-[1480px]">
          <div className="cp-public-reports-hero mb-6 flex flex-col justify-between gap-5 border-b border-white/5 pb-5 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#00dbe9]">
                Open Civic Registry
              </p>
              <h1 className="cp-public-reports-title mt-3 max-w-4xl text-4xl font-black uppercase leading-[0.94] tracking-tight text-white sm:text-6xl">
                Public proof for {cityDisplay.cityName}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[#dbc2b0] sm:text-base">
                Anyone can view issue history, location, repair proof, warranty status, contractor
                identity, and proof hashes for their city without login. Reporter identity stays anonymous.
              </p>
            </div>
            <div className="cp-public-report-hero-actions flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <LocationDetectButton compact />
              <Link
                href="/report"
                className="btn-primary-shimmer inline-flex items-center justify-center rounded bg-[#ffc08d] px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#4c2700] sm:w-auto"
              >
                Report Issue
              </Link>
            </div>
          </div>

          <div className="cp-public-report-stats mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={<DatabaseZap size={18} />} label="City Records" value={String(summary.total)} tone="cyan" />
            <StatCard icon={<Clock3 size={18} />} label="Pending Proof" value={String(summary.pending)} tone="gold" />
            <StatCard icon={<ShieldCheck size={18} />} label="Warranty Active" value={String(summary.warranty)} tone="green" />
            <StatCard icon={<AlertTriangle size={18} />} label="Critical Issues" value={String(summary.critical)} tone="red" />
          </div>

          <section className="cp-cyber-card cp-public-city-card mb-6 rounded-xl p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#00dbe9]">
                  {cityDisplay.isDetectedForSelected ? "GPS city matched" : "Selected city feed"}
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#dbc2b0]">
                  Public viewers see anonymous reports from the current city. The contractor or department
                  responsible for repair remains visible so accountability stays public.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[430px]">
                <InfoPill label="Area" value={cityDisplay.locationLabel} />
                <InfoPill label="Coordinates" value={cityDisplay.coordinates} />
              </div>
            </div>
          </section>

          <section className="cp-cyber-card cp-public-report-filters mb-6 rounded-xl p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
              <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/35 px-4 py-3">
                <Search size={17} className="text-[#00dbe9]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by report ID, issue, location, contractor..."
                  className="w-full bg-transparent font-mono text-sm text-white outline-none placeholder:text-[#dbc2b0]/45"
                />
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-[#ffc08d]/25 bg-[#ffc08d]/10 px-4 py-3">
                <Filter size={17} className="text-[#ffc08d]" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as "ALL" | ReportStatus)}
                  className="w-full bg-transparent font-mono text-xs font-bold uppercase text-[#ffdcc2] outline-none"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status} className="bg-[#050505] text-white">
                      {status === "ALL" ? "All Status" : statusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-[#00eb88]/25 bg-[#00eb88]/10 px-4 py-3">
                <MapPin size={17} className="text-[#00eb88]" />
                <select
                  value={cityFilter}
                  onChange={(event) => setCityFilter(event.target.value as "CURRENT" | CityKey)}
                  className="w-full bg-transparent font-mono text-xs font-bold uppercase text-[#5bffa1] outline-none"
                >
                  <option value="CURRENT" className="bg-[#050505] text-white">
                    Current City ({cityDisplay.cityName})
                  </option>
                  {demoCities.map((city) => (
                    <option key={city.key} value={city.key} className="bg-[#050505] text-white">
                      {cityDisplay.isDetectedForSelected && city.key === selectedCity.key
                        ? `${cityDisplay.cityName} GPS`
                        : city.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <div className="cp-public-report-layout grid gap-6 xl:grid-cols-[1fr_380px]">
            <section className="space-y-4">
              {loading && (
                <div className="cp-cyber-card rounded-xl p-8 text-center text-[#dbc2b0]">
                  Loading public reports from Supabase...
                </div>
              )}

              {!loading && filteredReports.length === 0 && (
                <div className="cp-cyber-card rounded-xl p-8 text-center">
                  <p className="text-lg font-semibold text-white">No public reports match this city filter.</p>
                  <p className="mt-2 text-sm text-[#dbc2b0]">Detect location or select another supported city.</p>
                </div>
              )}

              {filteredReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </section>

            <aside className="space-y-5">
              <section className="cp-cyber-card cp-public-latest-card sticky top-24 rounded-xl p-5">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#ffc08d]">
                  Latest City Record
                </p>
                {latestReport ? (
                  <>
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs text-[#00dbe9]">{latestReport.id}</p>
                        <h2 className="mt-2 text-xl font-black text-white">{latestReport.title}</h2>
                      </div>
                      <StatusBadge status={latestReport.status} />
                    </div>
                    <div className="mt-5 grid gap-3">
                      <MiniRow label="Location" value={latestReport.location} />
                      <MiniRow label="Reporter" value="Anonymous citizen" />
                      <MiniRow label="AI Confidence" value={`${latestReport.confidence}%`} />
                      <MiniRow label="Severity" value={latestReport.severity} />
                      <MiniRow label="Contractor" value={formatPublicContractor(latestReport)} />
                      <MiniRow label="Proof Hash" value={shortHash(latestReport.proofBundleHash)} />
                      <MiniRow label="Proof Ref" value={shortHash(latestReport.txHash)} />
                    </div>
                    <div className="mt-5 flex gap-3">
                      <Link
                        href={`/proof/${latestReport.id}`}
                        className="flex-1 rounded border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-4 py-3 text-center font-mono text-xs font-bold uppercase text-[#7df4ff] transition hover:bg-[#00dbe9]/15"
                      >
                        Open Proof
                      </Link>
                      <a
                        href={latestReport.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="grid h-11 w-11 place-items-center rounded border border-[#ffc08d]/35 bg-[#ffc08d]/10 text-[#ffdcc2] transition hover:bg-[#ffc08d]/15"
                        aria-label="Open map"
                      >
                        <ArrowUpRight size={17} />
                      </a>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-[#dbc2b0]">No report selected.</p>
                )}
              </section>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function ReportCard({ report }: { report: CivicReport }) {
  const latestHistory = report.history?.[report.history.length - 1];

  return (
    <article className="cp-cyber-card cp-cyber-card-hover cp-public-report-card rounded-xl p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-[#00dbe9]/30 bg-[#00dbe9]/10 px-2 py-1 font-mono text-xs font-bold text-[#7df4ff]">
              {report.id}
            </span>
            <StatusBadge status={report.status} />
            <span className="rounded border border-[#ffb4ab]/25 bg-[#ffb4ab]/10 px-2 py-1 font-mono text-[10px] font-bold uppercase text-[#ffdad6]">
              {report.severity}
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-black text-white">{report.title}</h2>
          <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-[#dbc2b0]">
            <MapPin size={16} className="mt-1 shrink-0 text-[#ffc08d]" />
            <span>{report.location}</span>
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#e5e2e3]/80">
            {report.aiSummary ?? "AI summary will appear after report verification."}
          </p>
        </div>

        <div className="cp-public-report-detail-grid grid min-w-[220px] gap-2 rounded-lg border border-white/10 bg-black/35 p-4">
          <MiniRow label="AI Score" value={`${report.confidence}%`} />
          <MiniRow label="SLA" value={report.slaHours ? `${report.slaHours} hrs` : "Not set"} />
          <MiniRow label="Ward" value={report.ward} />
          <MiniRow label="Reporter" value="Anonymous citizen" />
          <MiniRow label="Contractor" value={formatPublicContractor(report)} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <HashBox label="Evidence Hash" value={report.evidenceHash} />
        <HashBox label="Proof Bundle" value={report.proofBundleHash} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="rounded-lg border border-white/10 bg-black/25 p-4">
          <div className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#d3fbff]">
            <Sparkles size={15} />
            Latest Timeline Update
          </div>
          <p className="font-semibold text-white">{latestHistory?.label ?? "Report created"}</p>
          <p className="mt-1 text-sm leading-6 text-[#dbc2b0]">
            {latestHistory?.detail ?? report.recommendedAction ?? "Awaiting next public proof update."}
          </p>
        </div>

        <div className="cp-public-report-actions flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={`/proof/${report.id}`}
            className="inline-flex items-center justify-center gap-2 rounded border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-4 py-3 font-mono text-xs font-bold uppercase text-[#7df4ff] transition hover:bg-[#00dbe9]/15"
          >
            <FileText size={15} />
            Details
          </Link>
          <a
            href={report.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded border border-[#ffc08d]/35 bg-[#ffc08d]/10 px-4 py-3 font-mono text-xs font-bold uppercase text-[#ffdcc2] transition hover:bg-[#ffc08d]/15"
          >
            <MapPin size={15} />
            Map
          </a>
        </div>
      </div>
    </article>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "cyan" | "gold" | "green" | "red";
}) {
  const toneClasses = {
    cyan: "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#7df4ff]",
    gold: "border-[#ffc08d]/30 bg-[#ffc08d]/10 text-[#ffdcc2]",
    green: "border-[#00eb88]/30 bg-[#00eb88]/10 text-[#5bffa1]",
    red: "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffdad6]",
  }[tone];

  return (
    <div className={`cp-public-stat-card rounded-xl border p-4 ${toneClasses}`}>
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

function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={`rounded border px-2 py-1 font-mono text-[10px] font-bold uppercase ${statusTone[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/35 px-3 py-2">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#dbc2b0]/55">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#dbc2b0]/55">
        {label}
      </span>
      <span className="min-w-0 break-words text-right text-sm font-semibold text-white">{value ?? "Not available"}</span>
    </div>
  );
}

function HashBox({ label, value }: { label: string; value?: string }) {
  return (
    <div className="cp-public-hash-box rounded-lg border border-white/10 bg-black/25 p-4">
      <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#dbc2b0]/60">
        <Hash size={13} />
        {label}
      </div>
      <p className="break-all font-mono text-xs text-[#7df4ff]">{value ?? "Pending"}</p>
    </div>
  );
}

function formatPublicContractor(report: CivicReport) {
  const assigned = report.assignedContractorDetails;

  if (assigned) {
    return `${assigned.name} | ${assigned.contractorId}`;
  }

  const contractor = report.contractor?.trim();
  const unavailable =
    !contractor ||
    ["not assigned", "awaiting assignment", "awaiting contractor"].includes(contractor.toLowerCase());

  if (unavailable) {
    return "Awaiting public assignment";
  }

  return report.assignedContractorId ? `${contractor} | ${report.assignedContractorId}` : contractor;
}

function sortLatestFirst(first: CivicReport, second: CivicReport) {
  return getReportTime(second) - getReportTime(first);
}

function getReportTime(report: CivicReport) {
  return new Date(report.updatedAt ?? report.createdAt ?? 0).getTime();
}

function shortHash(value?: string) {
  if (!value) {
    return "Pending";
  }

  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}
