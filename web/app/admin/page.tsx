"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  MapPin,
  ScanSearch,
  ShieldAlert,
  UserRound,
  Wrench,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { LanguageSelector } from "@/src/components/layout/LanguageSelector";
import { NotificationBell } from "@/src/components/layout/NotificationBell";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { DEFAULT_CITY_KEY, demoCities, getCityByKey, type CityKey } from "@/src/lib/city-context";
import { getCitySnapshot, setSelectedCityKey, subscribeCity } from "@/src/lib/city-storage";
import { getAuthSnapshot, getCurrentUser, subscribeAuth } from "@/src/lib/auth-storage";
import { getReportsForCity, type CivicReport } from "@/src/lib/mock-data";
import {
  appendReportEvent,
  getLocalReportsSnapshot,
  subscribeLocalReports,
  upsertLocalReport,
} from "@/src/lib/report-storage";
import { useDetectedLocationDisplay } from "@/src/lib/use-detected-location";

const monitorStatuses: CivicReport["status"][] = [
  "OPEN",
  "PENDING_PROOF",
  "REPAIR_SUBMITTED",
  "UNDER_WARRANTY",
  "REPEAT_FAILURE",
];

export default function AdminPage() {
  const authSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => "");
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => DEFAULT_CITY_KEY);
  const localReportsSnapshot = useSyncExternalStore(
    subscribeLocalReports,
    getLocalReportsSnapshot,
    () => "[]"
  );
  const currentUser = useMemo(() => getCurrentUser(authSnapshot), [authSnapshot]);
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
  const monitoredReports = allReports
    .filter((report) => monitorStatuses.includes(report.status))
    .sort((first, second) => (second.aiPriorityScore ?? second.confidence) - (first.aiPriorityScore ?? first.confidence));
  const [selectedReportId, setSelectedReportId] = useState(monitoredReports[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const selectedReport = monitoredReports.find((report) => report.id === selectedReportId) ?? monitoredReports[0];
  const unassignedCount = monitoredReports.filter((report) => report.contractor === "Not assigned" || report.contractor === "Awaiting assignment").length;
  const slaRiskCount = monitoredReports.filter((report) => (report.slaHours ?? 48) <= 24 || report.severity === "Critical").length;
  const pendingProofCount = monitoredReports.filter((report) => report.status === "REPAIR_SUBMITTED").length;
  const isAdmin = currentUser?.role === "WARD_ADMIN";

  function assignContractor(report: CivicReport) {
    const assignedContractor = report.issueCategory === "POWER_OUTAGE" ? "Electricity restoration crew" : selectedCity.contractor;
    const updated = appendReportEvent(
      {
        ...report,
        cityKey: report.cityKey ?? selectedCity.key,
        contractor: assignedContractor,
        status: report.status === "OPEN" ? "PENDING_PROOF" : report.status,
        updatedAt: new Date().toISOString(),
      },
      {
        label: "Contractor assigned",
        detail: `${assignedContractor} assigned by ward admin for ${report.title}.`,
        time: new Date().toLocaleString(),
        tx: `0xassign...${report.id.slice(-3).toLowerCase()}`,
      }
    );

    upsertLocalReport(updated);
    setSelectedReportId(updated.id);
    setMessage(`${assignedContractor} assigned to ${updated.id}. Contractor panel is now synced.`);
  }

  if (!isAdmin) {
    return (
      <main className="cp-page-shell relative min-h-screen overflow-hidden bg-[#050505] text-[#e5e2e3]">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,153,51,0.14),transparent_28%),radial-gradient(circle_at_82%_8%,rgba(0,219,233,0.13),transparent_28%)]" />
        <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-8">
          <BrandLogo size="sm" subtitle="Admin Panel" />
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#ffdcc2] transition hover:border-[#00dbe9]/35 hover:text-[#7df4ff]"
          >
            <ArrowLeft size={15} />
            Dashboard
          </Link>
        </header>
        <section className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-4xl items-center px-4 pb-12">
          <div className="w-full rounded-2xl border border-[#ffc08d]/25 bg-[#061015]/88 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:p-8">
            <div className="grid h-14 w-14 place-items-center rounded-xl border border-[#ffc08d]/35 bg-[#ff9933]/10 text-[#ffdcc2]">
              <ShieldAlert size={26} />
            </div>
            <p className="mt-5 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#00dbe9]">
              Protected sector
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-white">
              Ward admin access is required.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#dbc2b0]">
              The admin panel is for assigning contractors, monitoring SLA risk, and coordinating city
              operations. Public viewers can still use the dashboard, warranty scanner, and proof pages
              without login.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[linear-gradient(135deg,#ffdcc2,#ff9933)] px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-[#4c2700]"
              >
                Login as admin
              </Link>
              <Link
                href="/warranty"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#7df4ff]"
              >
                Public history
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="cp-page-shell relative min-h-screen overflow-hidden bg-[#050505] text-[#e5e2e3]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,153,51,0.14),transparent_28%),radial-gradient(circle_at_82%_8%,rgba(0,219,233,0.13),transparent_28%),linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:auto,auto,34px_34px,34px_34px]" />
      <header className="relative z-20 flex flex-col gap-3 border-b border-[#ff9933]/15 bg-[#030507]/86 px-4 py-4 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <BrandLogo size="sm" subtitle="Admin Control" />
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffdcc2] transition hover:border-[#00dbe9]/35 hover:text-[#7df4ff]"
          >
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
          <NotificationBell />
          <ThemeToggle />
          <LanguageSelector compact />
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#00dbe9]">
              Ward admin sector
            </p>
            <h1 className="mt-2 text-4xl font-black leading-tight text-white sm:text-5xl">
              Contractor assignment and city monitoring
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#dbc2b0]">
              {cityDisplay.cityName} node: assign responsible contractors, track SLA risk, and keep
              the public dashboard synced with every operational decision.
            </p>
          </div>
          <select
            value={selectedCity.key}
            onChange={(event) => setSelectedCityKey(event.target.value as CityKey)}
            className="min-h-11 rounded-md border border-[#00dbe9]/30 bg-black/40 px-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#7df4ff]"
          >
            {demoCities.map((city) => (
              <option key={city.key} value={city.key}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Active incidents" value={String(monitoredReports.length).padStart(2, "0")} />
          <Stat label="Unassigned" value={String(unassignedCount).padStart(2, "0")} tone="amber" />
          <Stat label="SLA risk" value={String(slaRiskCount).padStart(2, "0")} tone="rose" />
          <Stat label="Proof waiting" value={String(pendingProofCount).padStart(2, "0")} tone="cyan" />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.35fr]">
          <aside className="rounded-2xl border border-white/10 bg-black/28 p-4 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#ffc08d]">
                Ward issue queue
              </h2>
              <span className="rounded-full border border-[#00eb88]/25 bg-[#00eb88]/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#8fffc1]">
                Live
              </span>
            </div>
            <div className="space-y-3">
              {monitoredReports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedReportId(report.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedReport?.id === report.id
                      ? "border-[#ffc08d]/55 bg-[#ff9933]/12"
                      : "border-white/10 bg-white/[0.03] hover:border-[#00dbe9]/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{report.title}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-[#a38d7c]">
                        <MapPin size={13} />
                        {report.location}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 font-mono text-[9px] uppercase text-[#dbc2b0]">
                      {report.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                    <Chip label={report.severity} />
                    <Chip label={`Ward ${report.ward}`} />
                    <Chip label={`${report.aiPriorityScore ?? report.confidence}/100 AI`} />
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {selectedReport && (
            <section className="rounded-2xl border border-white/10 bg-[#061015]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#00dbe9]">
                    Selected issue
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-white">{selectedReport.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[#dbc2b0]">
                    {selectedReport.aiSummary ?? "AI summary pending for this issue."}
                  </p>
                </div>
                <Link
                  href={`/proof/${selectedReport.id}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#7df4ff]"
                >
                  Public proof
                </Link>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Info icon={<ShieldAlert size={16} />} label="Severity" value={selectedReport.severity} />
                <Info icon={<Clock3 size={16} />} label="SLA" value={`${selectedReport.slaHours ?? 48} hrs`} />
                <Info icon={<ScanSearch size={16} />} label="AI priority" value={`${selectedReport.aiPriorityScore ?? selectedReport.confidence}/100`} />
                <Info icon={<Building2 size={16} />} label="Contractor" value={selectedReport.contractor} />
              </div>

              <div className="mt-6 rounded-xl border border-[#ffc08d]/20 bg-[#ff9933]/8 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#ffc08d]">
                      Assignment action
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#dbc2b0]">
                      Assign the correct sector team. Road issues go to {selectedCity.contractor};
                      power outage reports go to Electricity restoration crew.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => assignContractor(selectedReport)}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,#ffdcc2,#ff9933)] px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-[#4c2700] transition hover:brightness-110"
                  >
                    <Wrench size={16} />
                    Assign contractor
                  </button>
                </div>
                {message && (
                  <p className="mt-4 rounded-md border border-[#00eb88]/25 bg-[#00eb88]/10 px-4 py-3 text-sm text-[#8fffc1]">
                    {message}
                  </p>
                )}
              </div>

              <div className="mt-6 grid gap-3 lg:grid-cols-3">
                <ActionCard icon={<UserRound size={18} />} title="Citizen side" detail="Reporter can later approve proof and close the issue." />
                <ActionCard icon={<BadgeCheck size={18} />} title="Contractor side" detail="Assigned case appears in contractor repair queue." />
                <ActionCard icon={<CheckCircle2 size={18} />} title="Public side" detail="Every assignment remains visible in proof history." />
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, tone = "emerald" }: { label: string; value: string; tone?: "emerald" | "amber" | "rose" | "cyan" }) {
  const color =
    tone === "amber" ? "text-[#ffc08d]" : tone === "rose" ? "text-[#ffb4ab]" : tone === "cyan" ? "text-[#7df4ff]" : "text-[#8fffc1]";

  return (
    <div className="rounded-xl border border-white/10 bg-black/28 p-4 backdrop-blur-xl">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#a38d7c]">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/24 p-4">
      <div className="mb-3 text-[#00dbe9]">{icon}</div>
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#a38d7c]">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 font-mono uppercase tracking-[0.1em] text-[#dbc2b0]">
      {label}
    </span>
  );
}

function ActionCard({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <div className="text-[#ffc08d]">{icon}</div>
      <p className="mt-3 font-bold text-white">{title}</p>
      <p className="mt-2 text-xs leading-5 text-[#a38d7c]">{detail}</p>
    </div>
  );
}
