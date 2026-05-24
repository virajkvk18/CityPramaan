/* eslint-disable @next/next/no-img-element */
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarClock,
  FileImage,
  LayoutDashboard,
  Radar,
  Router,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { demoCities, getCityByKey, type CityKey } from "@/src/lib/city-context";
import { getCitySnapshot, setSelectedCityKey, subscribeCity } from "@/src/lib/city-storage";
import { getReportsForCity, type CivicReport } from "@/src/lib/mock-data";
import { getLocalReportsSnapshot, subscribeLocalReports } from "@/src/lib/report-storage";

export default function WarrantyScannerPage() {
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => "bhopal");
  const localReportsSnapshot = useSyncExternalStore(
    subscribeLocalReports,
    getLocalReportsSnapshot,
    () => "[]"
  );
  const selectedCity = getCityByKey(citySnapshot);
  const localReports = useMemo(
    () => JSON.parse(localReportsSnapshot) as CivicReport[],
    [localReportsSnapshot]
  );
  const allReports = useMemo(() => {
    const localForCity = localReports.filter((report) => !report.cityKey || report.cityKey === selectedCity.key);
    const localIds = new Set(localForCity.map((report) => report.id));
    return [...localForCity, ...getReportsForCity(selectedCity.key).filter((report) => !localIds.has(report.id))];
  }, [localReports, selectedCity.key]);
  const warrantyReports = allReports.filter((report) =>
    ["UNDER_WARRANTY", "REPEAT_FAILURE", "REPAIR_SUBMITTED", "PENDING_PROOF", "OPEN"].includes(report.status)
  );
  const [selectedReportId, setSelectedReportId] = useState(warrantyReports[0]?.id ?? "");
  const [scanning, setScanning] = useState(false);
  const selectedReport =
    warrantyReports.find((report) => report.id === selectedReportId) ?? warrantyReports[0];

  function scanForFailure() {
    setScanning(true);
    window.setTimeout(() => setScanning(false), 900);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#e5e2e3]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,153,51,0.16),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(0,219,233,0.14),transparent_28%),radial-gradient(circle_at_48%_94%,rgba(0,235,136,0.08),transparent_30%)]" />
      <div className="bg-holo-grid pointer-events-none fixed inset-0" />
      <div className="stitch-cityline pointer-events-none fixed bottom-0 left-0 right-0 h-44 opacity-20" />

      <header className="fixed top-0 z-50 hidden h-16 w-full items-center justify-between border-b border-[#ff9933]/15 bg-[#030507]/75 px-8 shadow-[0_0_30px_rgba(0,219,233,0.08)] backdrop-blur-xl md:flex">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="grid h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0] transition hover:border-[#00dbe9]/60 hover:text-[#00dbe9]"
            aria-label="Back to command center"
          >
            <ArrowLeft size={17} />
          </Link>
          <BrandLogo size="sm" subtitle="Warranty breach scanner" />
        </div>
        <div className="flex items-center gap-3">
          <button className="grid h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0]/70 transition hover:text-[#00eb88]">
            <Bell size={16} />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0]/70 transition hover:text-[#00eb88]">
            <Settings size={16} />
          </button>
          <ThemeToggle />
        </div>
      </header>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[#ff9933]/15 bg-[linear-gradient(180deg,rgba(255,153,51,0.08),rgba(0,0,0,0.5)_22%,rgba(0,219,233,0.045))] px-4 pb-5 pt-20 shadow-[5px_0_24px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:flex">
        <div className="mt-2 border-b border-white/10 px-2 pb-5">
          <BrandLogo size="sm" subtitle="Warranty breach scanner" />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Command Center" />
          <NavItem href="/proof/CP-004" icon={<BadgeCheck size={18} />} label="Verified Repairs" />
          <NavItem href="/report" icon={<AlertTriangle size={18} />} label="Active Reports" />
          <NavItem href="/warranty" icon={<ShieldAlert size={18} />} label="Warranty Scanner" active />
          <NavItem href="/contractor" icon={<ShieldCheck size={18} />} label="Contractor Audit" />
        </nav>

        <Link
          href="/report"
          className="btn-primary-shimmer grid rounded bg-[#ffc08d] px-4 py-3 text-center font-mono text-xs font-semibold text-[#4c2700]"
        >
          Submit Report
        </Link>

        <div className="mt-5 border-t border-white/5 pt-4">
          <NavItem href="/" icon={<Router size={15} />} label="System Status" small />
          <NavItem href="/about" icon={<BookOpen size={15} />} label="Documentation" small />
        </div>
      </aside>

      <section className="relative z-10 min-h-screen px-4 pb-10 pt-6 md:ml-64 md:px-8 md:pt-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-7 flex flex-col justify-between gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-end">
            <div>
              <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-[#dbc2b0] md:hidden">
                <ArrowLeft size={16} />
                Back to Command Center
              </Link>
              <p className="font-mono text-xs uppercase text-[#00dbe9]">Synced warranty registry</p>
              <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
                Warranty Scanner <span className="text-[#dbc2b0]/35">|</span> Public Proof
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#dbc2b0]">
                Every contractor proof that activates a warranty appears here. Unrepaired reports
                stay visible as not active, so judges can see the full lifecycle.
              </p>
            </div>
            <select
              value={selectedCity.key}
              onChange={(event) => {
                setSelectedCityKey(event.target.value as CityKey);
                setSelectedReportId("");
              }}
              className="input-recessed rounded px-4 py-3 font-mono text-sm text-white"
            >
              {demoCities.map((city) => (
                <option key={city.key} value={city.key} className="bg-[#050505] text-white">
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-4">
              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-mono text-xs uppercase text-[#ffc08d]">Warranty Registry</h3>
                  <span className="rounded border border-[#00dbe9]/25 bg-[#00dbe9]/10 px-2 py-1 font-mono text-[10px] text-[#00dbe9]">
                    {warrantyReports.length} cases
                  </span>
                </div>
                <div className="space-y-3">
                  {warrantyReports.map((report) => (
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
                        <WarrantyBadge report={report} />
                      </div>
                      <p className="mt-2 text-xs text-[#dbc2b0]/70">{report.location}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <h3 className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3 font-mono text-xs uppercase text-[#d3fbff]">
                  <Sparkles size={15} />
                  AI Diagnostics Verdict
                </h3>
                <div className="space-y-4">
                  <Diagnostic label="Primary Cause" value="Substandard asphalt grade" score="85%" tone="rose" />
                  <Diagnostic label="Secondary Factor" value="Base compaction issue" score="62%" tone="amber" />
                  <Diagnostic label="Weather Overlay" value="Non-causal weathering" score="12%" tone="emerald" />
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-8">
              {selectedReport ? (
                <>
                  <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                    <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-start">
                      <div>
                        <p className="font-mono text-xs uppercase text-[#ffc08d]">
                          Selected warranty case | {selectedReport.id}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">{selectedReport.title}</h2>
                        <p className="mt-2 text-sm text-[#dbc2b0]">{selectedReport.location}</p>
                      </div>
                      <button
                        onClick={scanForFailure}
                        disabled={scanning}
                        className="btn-primary-shimmer flex items-center justify-center gap-2 rounded border border-[#ffb4ab] bg-[#93000a]/40 px-4 py-3 font-mono text-xs font-semibold text-[#ffb4ab] transition hover:bg-[#93000a]/55 disabled:cursor-wait disabled:opacity-70"
                      >
                        <Radar size={16} className={scanning ? "animate-spin" : ""} />
                        {scanning ? "Scanning..." : "Scan Repeat Failure"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <Info label="Status" value={statusLabel(selectedReport)} />
                      <Info label="Warranty" value={warrantyLabel(selectedReport)} />
                      <Info label="Contractor" value={selectedReport.contractor} />
                      <Info label="Public Hash" value={selectedReport.evidenceHash ?? selectedReport.txHash} />
                    </div>

                    {scanning && (
                      <div className="mt-5 rounded border border-[#00dbe9]/20 bg-[#00dbe9]/10 p-4 text-sm text-[#dbc2b0]">
                        Comparing latest reports with this repaired segment and warranty window...
                      </div>
                    )}
                  </section>

                  <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                    <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-end">
                      <h3 className="flex items-center gap-2 font-mono text-xs uppercase text-[#ffc08d]">
                        <FileImage size={15} />
                        Public Evidence Comparison
                      </h3>
                      <Link
                        href={`/proof/${selectedReport.id}`}
                        className="rounded border border-[#00dbe9]/30 bg-[#00dbe9]/10 px-4 py-2 text-sm font-semibold text-[#00dbe9]"
                      >
                        Open Public Proof
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <EvidencePanel
                        label="Citizen Issue Before"
                        image={selectedReport.issueImageDataUrl}
                        status={selectedReport.issueImageName ?? selectedReport.aiSummary ?? "Reported civic issue"}
                        tone="rose"
                      />
                      <EvidencePanel
                        label="Contractor Repair After"
                        image={selectedReport.repairImageDataUrl}
                        status={
                          selectedReport.repairImageName ??
                          (selectedReport.status === "UNDER_WARRANTY"
                            ? "Repair proof available"
                            : "No repair proof submitted yet")
                        }
                        tone="emerald"
                      />
                    </div>
                  </section>

                  <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                    <h3 className="mb-6 flex items-center gap-2 border-b border-white/5 pb-3 font-mono text-xs uppercase text-[#d3fbff]">
                      <CalendarClock size={15} />
                      Synced Warranty Timeline
                    </h3>
                    <div className="relative flex flex-col gap-7 border-l border-white/10 pl-6">
                      {(selectedReport.history?.length ? selectedReport.history : fallbackHistory(selectedReport)).map(
                        (event, index) => (
                          <TimelineNode
                            key={`${event.label}-${index}`}
                            title={event.label}
                            date={event.time}
                            detail={event.detail}
                            active={index === (selectedReport.history?.length ?? 0) - 1}
                          />
                        )
                      )}
                    </div>
                  </section>
                </>
              ) : (
                <div className="cp-cyber-card rounded-lg p-8 text-center">
                  <p className="text-xl font-semibold text-white">No warranty records yet.</p>
                  <Link href="/contractor" className="mt-4 inline-flex rounded bg-[#ffc08d] px-5 py-3 font-semibold text-[#4c2700]">
                    Submit contractor proof
                  </Link>
                </div>
              )}
            </div>
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
  small = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded px-4 py-3 transition ${
        active
          ? "border-r-2 border-[#ffc08d] bg-[#ffc08d]/10 text-[#ffc08d] shadow-[inset_0_0_12px_rgba(255,183,122,0.18)]"
          : "text-[#dbc2b0]/60 hover:bg-white/[0.04] hover:text-[#d3fbff]"
      } ${small ? "py-2 text-xs" : "font-mono text-xs"}`}
    >
      {icon}
      {label}
    </Link>
  );
}

function WarrantyBadge({ report }: { report: CivicReport }) {
  const active = report.status === "UNDER_WARRANTY" || report.status === "REPEAT_FAILURE";
  const pending = report.status === "REPAIR_SUBMITTED";

  return (
    <span
      className={`shrink-0 rounded border px-2 py-1 font-mono text-[10px] uppercase ${
        active
          ? "border-[#00eb88]/30 bg-[#00eb88]/10 text-[#00eb88]"
          : pending
            ? "border-[#ffc08d]/30 bg-[#ffc08d]/10 text-[#ffc08d]"
            : "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]"
      }`}
    >
      {active ? "Active" : pending ? "Pending" : "Not Active"}
    </span>
  );
}

function statusLabel(report: CivicReport) {
  const labels = {
    OPEN: "Open",
    PENDING_PROOF: "Needs Repair",
    REPAIR_SUBMITTED: "Proof Pending",
    UNDER_WARRANTY: "Active",
    REPEAT_FAILURE: "Breach",
  };

  return labels[report.status];
}

function warrantyLabel(report: CivicReport) {
  if (report.status === "UNDER_WARRANTY" || report.status === "REPEAT_FAILURE") {
    return `${report.warrantyDaysLeft ?? report.warrantyPeriodDays ?? 90} days left`;
  }

  if (report.status === "REPAIR_SUBMITTED") {
    return "Awaiting activation";
  }

  return "Not active";
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/35 p-3">
      <p className="font-mono text-[10px] uppercase text-[#dbc2b0]/60">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Diagnostic({
  label,
  value,
  score,
  tone,
}: {
  label: string;
  value: string;
  score: string;
  tone: "rose" | "amber" | "emerald";
}) {
  const bars = {
    rose: "bg-[#ffb4ab] w-[85%] text-[#ffb4ab]",
    amber: "bg-[#ffc08d] w-[62%] text-[#ffc08d]",
    emerald: "bg-[#00eb88] w-[12%] text-[#00eb88]",
  };
  const [bar, width, text] = bars[tone].split(" ");

  return (
    <div>
      <p className="font-mono text-[10px] uppercase text-[#dbc2b0]/55">{label}</p>
      <p className="mt-1 text-sm text-white">{value}</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full ${bar} ${width}`} />
      </div>
      <p className={`mt-1 text-right font-mono text-[10px] ${text}`}>{score} confidence</p>
    </div>
  );
}

function EvidencePanel({
  label,
  image,
  status,
  tone,
}: {
  label: string;
  image?: string;
  status: string;
  tone: "rose" | "emerald";
}) {
  const isRose = tone === "rose";

  return (
    <div>
      <div className={`relative h-60 overflow-hidden rounded border bg-black ${isRose ? "border-[#ffb4ab]/35" : "border-[#00eb88]/30"}`}>
        <span
          className={`absolute left-2 top-2 z-20 rounded border bg-black/80 px-2 py-1 font-mono text-[10px] ${
            isRose ? "border-[#ffb4ab]/45 text-[#ffb4ab]" : "border-[#00eb88]/35 text-[#00eb88]"
          }`}
        >
          {label}
        </span>
        {image ? (
          <img src={image} alt={label} className="absolute inset-0 h-full w-full object-cover opacity-75" />
        ) : (
          <>
            <div className="absolute inset-0 evidence-asphalt opacity-80" />
            <div
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border ${
                isRose
                  ? "cp-road-crater h-24 w-36 border-[#ffb4ab]/45 bg-[#2a0d0d]"
                  : "cp-road-patch h-20 w-44 border-[#00eb88]/35 bg-[#042b18]/85"
              }`}
            />
          </>
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>
      <p className="mt-2 px-1 text-xs text-[#dbc2b0]/70">{status}</p>
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
      label: report.status === "UNDER_WARRANTY" ? "Warranty activated" : "Awaiting contractor repair",
      detail:
        report.status === "UNDER_WARRANTY"
          ? "Contractor proof passed audit and warranty monitoring is active."
          : "No repair warranty has been activated for this case yet.",
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
