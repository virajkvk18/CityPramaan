/* eslint-disable @next/next/no-img-element */
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CalendarClock,
  ExternalLink,
  FileImage,
  LayoutDashboard,
  MapPin,
  Radar,
  Router,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { LanguageSelector } from "@/src/components/layout/LanguageSelector";
import { NotificationBell } from "@/src/components/layout/NotificationBell";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { DEFAULT_CITY_KEY, demoCities, getCityByKey, type CityKey } from "@/src/lib/city-context";
import { getCitySnapshot, setSelectedCityKey, subscribeCity } from "@/src/lib/city-storage";
import { getReportsForCity, type CivicReport } from "@/src/lib/mock-data";
import { getLocalReportsSnapshot, subscribeLocalReports } from "@/src/lib/report-storage";
import { mergeReportsById, watchBackendReports } from "@/src/lib/report-sync";
import { translate } from "@/src/lib/language-context";
import { getLanguageSnapshot, subscribeLanguage } from "@/src/lib/language-storage";
import { useDetectedLocationDisplay } from "@/src/lib/use-detected-location";
import { requestWarrantyRisk, type AiAgentAudit, type AiWarrantyRiskResult } from "@/src/lib/ai-agents-client";

export default function WarrantyScannerPage() {
  const linkedIssueId = useSyncExternalStore(
    subscribeUrl,
    getIssueIdFromUrl,
    () => ""
  );
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => DEFAULT_CITY_KEY);
  const languageSnapshot = useSyncExternalStore(
    subscribeLanguage,
    getLanguageSnapshot,
    () => "en"
  );
  const localReportsSnapshot = useSyncExternalStore(
    subscribeLocalReports,
    getLocalReportsSnapshot,
    () => "[]"
  );
  const selectedCity = getCityByKey(citySnapshot);
  const cityDisplay = useDetectedLocationDisplay(selectedCity);
  const tr = (key: Parameters<typeof translate>[1]) => translate(languageSnapshot, key);
  const [backendReports, setBackendReports] = useState<CivicReport[]>([]);
  const localReports = useMemo(
    () => JSON.parse(localReportsSnapshot) as CivicReport[],
    [localReportsSnapshot]
  );
  useEffect(() => {
    return watchBackendReports(selectedCity.key, setBackendReports);
  }, [selectedCity.key]);
  const allReports = useMemo(() => {
    return mergeReportsById(
      getReportsForCity(selectedCity.key),
      backendReports,
      localReports
    ).filter((report) => !report.cityKey || report.cityKey === selectedCity.key);
  }, [backendReports, localReports, selectedCity.key]);
  const warrantyReports = allReports
    .filter((report) =>
      [
        "UNDER_WARRANTY",
        "REPEAT_FAILURE",
        "REPAIR_SUBMITTED",
        "ADMIN_APPROVED",
        "REPAIR_REJECTED",
        "CITIZEN_DISPUTED",
        "ASSIGNED_TO_CONTRACTOR",
        "WORK_ACCEPTED",
        "WORK_STARTED",
        "WORK_COMPLETED",
        "PENDING_PROOF",
        "OPEN",
        "CLOSED",
      ].includes(report.status)
    )
    .sort(sortWarrantyReports);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [warrantyRisk, setWarrantyRisk] = useState<AiWarrantyRiskResult | null>(null);
  const [scanMessage, setScanMessage] = useState("Warranty Risk Agent is ready.");
  const selectedReport =
    warrantyReports.find((report) => report.id === selectedReportId) ??
    warrantyReports.find((report) => report.id === linkedIssueId) ??
    warrantyReports[0];

  async function scanForFailure() {
    if (!selectedReport) {
      setScanMessage("Select a case before scanning warranty risk.");
      return;
    }

    setScanning(true);
    setScanMessage("Running Warranty Risk Agent with civic RAG rules...");

    try {
      const risk = await requestWarrantyRisk({
        report: selectedReport,
        cityReports: allReports,
      });

      setWarrantyRisk(risk);
      setScanMessage("Warranty Risk Agent completed.");
    } catch (error) {
      console.warn("Warranty Risk Agent unavailable:", error);
      setScanMessage("Warranty Risk Agent fell back to local civic rules.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <main className="cp-page-shell relative min-h-screen overflow-hidden bg-[#050505] text-[#e5e2e3]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,153,51,0.16),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(0,219,233,0.14),transparent_28%),radial-gradient(circle_at_48%_94%,rgba(0,235,136,0.08),transparent_30%)]" />
      <div className="bg-holo-grid pointer-events-none fixed inset-0" />
      <div className="stitch-cityline pointer-events-none fixed bottom-0 left-0 right-0 h-44 opacity-20" />

      <header className="fixed top-0 z-50 flex min-h-16 w-full flex-wrap items-center justify-between gap-3 border-b border-[#ff9933]/15 bg-[#030507]/75 px-3 py-3 shadow-[0_0_30px_rgba(0,219,233,0.08)] backdrop-blur-xl md:h-16 md:flex-nowrap md:px-8 md:py-0">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Link
            href="/"
            className="grid h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0] transition hover:border-[#00dbe9]/60 hover:text-[#00dbe9]"
            aria-label="Back to command center"
          >
            <ArrowLeft size={17} />
          </Link>
          <BrandLogo size="sm" subtitle={tr("warrantyScanner")} />
        </div>
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <NotificationBell />
          <button className="hidden h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0]/70 transition hover:text-[#00eb88] sm:grid">
            <Settings size={16} />
          </button>
          <LanguageSelector compact />
          <ThemeToggle />
        </div>
      </header>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[#ff9933]/15 bg-[linear-gradient(180deg,rgba(255,153,51,0.08),rgba(0,0,0,0.5)_22%,rgba(0,219,233,0.045))] px-4 pb-5 pt-20 shadow-[5px_0_24px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:flex">
        <div className="mt-2 border-b border-white/10 px-2 pb-5">
          <BrandLogo size="sm" subtitle={tr("warrantyScanner")} />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label={tr("commandCenter")} />
          <NavItem href="/proof/CP-004" icon={<BadgeCheck size={18} />} label={tr("verifiedRepairs")} />
          <NavItem href="/report" icon={<AlertTriangle size={18} />} label={tr("reportIssue")} />
          <NavItem href="/pending" icon={<FileImage size={18} />} label={tr("pendingProof")} />
          <NavItem href="/warranty" icon={<ShieldAlert size={18} />} label={tr("warrantyScanner")} active />
          <NavItem href="/contractor" icon={<ShieldCheck size={18} />} label={tr("contractorAudit")} />
        </nav>

        <Link
          href="/report"
          className="btn-primary-shimmer grid rounded bg-[#ffc08d] px-4 py-3 text-center font-mono text-xs font-semibold text-[#4c2700]"
        >
          {tr("submitReport")}
        </Link>

        <div className="mt-5 border-t border-white/5 pt-4">
          <NavItem href="/" icon={<Router size={15} />} label={tr("systemStatus")} small />
          <NavItem href="/about" icon={<BookOpen size={15} />} label={tr("documentation")} small />
        </div>
      </aside>

      <section className="relative z-10 min-h-screen px-4 pb-10 pt-24 md:ml-64 md:px-8 md:pt-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-7 flex flex-col justify-between gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-end">
            <div>
              <Link href="/" className="hidden">
                <ArrowLeft size={16} />
                Back to Command Center
              </Link>
              <p className="font-mono text-xs uppercase text-[#00dbe9]">{tr("publicRegistry")}</p>
              <h1 className="mt-2 text-3xl font-semibold text-white sm:text-5xl">
                {tr("warrantyScanner")} <span className="text-[#dbc2b0]/35">|</span> {tr("publicProof")}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#dbc2b0]">
                {cityDisplay.isDetectedForSelected
                  ? `${tr("publicRegistrySubtitle")} Current city detected as ${cityDisplay.cityName}, ${cityDisplay.regionName}.`
                  : tr("publicRegistrySubtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LanguageSelector />
              <label className="flex items-center gap-2 rounded border border-[#ffc08d]/25 bg-[#ffc08d]/10 px-3 py-2 text-[#ffc08d]">
                <MapPin size={15} />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]">{tr("city")}</span>
                <select
                  value={selectedCity.key}
                  onChange={(event) => {
                    setSelectedCityKey(event.target.value as CityKey);
                    setSelectedReportId("");
                  }}
                  className="bg-transparent font-mono text-xs font-bold text-[#ffc08d] outline-none"
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
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-4">
              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-mono text-xs uppercase text-[#ffc08d]">{tr("publicIssueHistory")}</h3>
                  <span className="rounded border border-[#00dbe9]/25 bg-[#00dbe9]/10 px-2 py-1 font-mono text-[10px] text-[#00dbe9]">
                    {warrantyReports.length} cases
                  </span>
                </div>
                <div className="space-y-3">
                  {warrantyReports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => {
                        setSelectedReportId(report.id);
                        setWarrantyRisk(null);
                        setScanMessage("Warranty Risk Agent is ready.");
                      }}
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
                        <WarrantyBadge
                          report={report}
                          activeText={tr("active")}
                          pendingText={tr("pending")}
                          notActiveText={tr("notActive")}
                          closedText="Closed"
                        />
                      </div>
                      <p className="mt-2 text-xs text-[#dbc2b0]/70">{report.location}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <h3 className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3 font-mono text-xs uppercase text-[#d3fbff]">
                  <Sparkles size={15} />
                  {tr("aiDiagnosticsVerdict")}
                </h3>
                <div className="space-y-4">
                  <Diagnostic
                    label="Before / After Difference"
                    value={selectedReport?.repairAudit?.beforeAfterDelta ?? "Awaiting contractor proof"}
                    score={selectedReport?.repairAudit?.closureConfidence ?? `${selectedReport?.confidence ?? 0}%`}
                    tone={selectedReport?.repairAudit ? "emerald" : "amber"}
                  />
                  <Diagnostic
                    label="Visible Damage Remaining"
                    value={selectedReport?.repairAudit?.visibleDamageRemaining ?? "Unknown"}
                    score={selectedReport?.repairAudit?.materialMatch ?? tr("pending")}
                    tone={selectedReport?.repairAudit?.visibleDamageRemaining === "High" ? "rose" : "emerald"}
                  />
                  <Diagnostic
                    label="AI Recommendation"
                    value={
                      selectedReport?.repairAudit?.recommendation ??
                      selectedReport?.recommendedAction ??
                      "Collect repair proof first."
                    }
                    score={selectedReport?.repairAudit?.repairIntegrity ?? tr("pending")}
                    tone={selectedReport?.repairAudit?.repairIntegrity === "Low" ? "rose" : "amber"}
                  />
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
                          {tr("selectedCase")} | {selectedReport.id}
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
                        {scanning ? `${tr("scanRepeatFailure")}...` : tr("scanRepeatFailure")}
                      </button>
                    </div>

                    <div className="cp-stagger-grid grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <Info label={tr("status")} value={statusLabel(selectedReport, tr)} />
                      <Info label={tr("warranty")} value={warrantyLabel(selectedReport, tr)} />
                      <Info label={tr("contractor")} value={selectedReport.contractor} />
                      <Info label="AI priority" value={selectedReport.aiPriorityScore ? `${selectedReport.aiPriorityScore}/100` : "Pending"} />
                      <Info label={tr("publicHash")} value={selectedReport.proofBundleHash ?? selectedReport.evidenceHash ?? selectedReport.txHash} />
                      <Info label="Repair hash" value={selectedReport.repairEvidenceHash ?? selectedReport.repairTxHash ?? "Pending"} />
                    </div>

                    {selectedReport.status === "CLOSED" && (
                      <div className="mt-5 rounded border border-[#00eb88]/25 bg-[#00eb88]/10 p-4 text-sm leading-6 text-[#d3fbff]">
                        Issue closed by the report issuer. Repair proof, public feedback, warranty data,
                        and the full proof timeline stay visible here as public history.
                      </div>
                    )}

                  {scanning && (
                    <div className="cp-fade-in mt-5 rounded border border-[#00dbe9]/20 bg-[#00dbe9]/10 p-4 text-sm text-[#dbc2b0]">
                      {tr("repeatFailureScan")} / {tr("warranty")}
                    </div>
                  )}

                  <div className={`mt-5 rounded border p-4 ${warrantyRiskPanelTone(warrantyRisk?.riskLevel)}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em]">
                          Warranty Risk Agent
                        </p>
                        <p className="mt-1 text-sm">{scanMessage}</p>
                      </div>
                      <span className="rounded border border-white/15 bg-black/25 px-3 py-1 font-mono text-xs font-bold">
                        {warrantyRisk?.riskLevel ?? "READY"}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <Info
                        label="Repeat probability"
                        value={
                          typeof warrantyRisk?.repeatProbability === "number"
                            ? `${warrantyRisk.repeatProbability}/100`
                            : "Run scan"
                        }
                      />
                      <Info
                        label="Warranty breach"
                        value={warrantyRisk?.warrantyBreachLikely ? "Likely" : "Not flagged"}
                      />
                      <Info
                        label="Matched reports"
                        value={
                          warrantyRisk?.matchedReportIds.length
                            ? warrantyRisk.matchedReportIds.join(", ")
                            : "None"
                        }
                      />
                    </div>
                    <p className="mt-4 text-sm leading-6">
                      {warrantyRisk?.reason ?? "The agent checks same-location/category history, warranty status, and civic repeat-failure policy."}
                    </p>
                    <p className="mt-3 rounded border border-white/10 bg-black/25 p-3 text-sm leading-6">
                      {warrantyRisk?.recommendedAction ?? "Run scan to generate warranty action."}
                    </p>
                    {warrantyRisk?.aiAudit && <AgentAuditPanel audit={warrantyRisk.aiAudit} />}
                  </div>
                </section>

                  <IssueProgressPanel report={selectedReport} />

                  {selectedReport.utilityRestoration && (
                    <UtilityRestorationPanel report={selectedReport} />
                  )}

                  <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                    <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-end">
                      <h3 className="flex items-center gap-2 font-mono text-xs uppercase text-[#ffc08d]">
                        <FileImage size={15} />
                        {tr("publicProof")}
                      </h3>
                      <Link
                        href={`/proof/${selectedReport.id}`}
                        className="rounded border border-[#00dbe9]/30 bg-[#00dbe9]/10 px-4 py-2 text-sm font-semibold text-[#00dbe9]"
                      >
                        {tr("openPublicProof")}
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <EvidencePanel
                        label={tr("issueBefore")}
                        image={selectedReport.issueImageDataUrl}
                        status={selectedReport.issueImageName ?? selectedReport.aiSummary ?? tr("citizenReport")}
                        tone="rose"
                      />
                      <EvidencePanel
                        label={tr("contractorProofAfter")}
                        image={selectedReport.repairImageDataUrl}
                        status={
                          selectedReport.repairImageName ??
                          (selectedReport.status === "UNDER_WARRANTY" || selectedReport.status === "CLOSED"
                            ? tr("repairImageVisible")
                            : tr("noRepairProofYet"))
                        }
                        tone="emerald"
                      />
                    </div>
                  </section>

                  <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                    <h3 className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3 font-mono text-xs uppercase text-[#00dbe9]">
                      <MapPin size={15} />
                      {tr("mapLocation")}
                    </h3>
                    <GoogleMapPreview
                      report={selectedReport}
                      exactLocationLabel={tr("exactPublicLocation")}
                      openMapsLabel={tr("openGoogleMaps")}
                      pendingLocationLabel={tr("mapLocationSubtitle")}
                    />
                  </section>

                  <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                    <h3 className="mb-6 flex items-center gap-2 border-b border-white/5 pb-3 font-mono text-xs uppercase text-[#d3fbff]">
                      <CalendarClock size={15} />
                      {tr("syncedWarrantyRegistry")} / {tr("proofTimeline")}
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

                  <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                    <h3 className="mb-4 border-b border-white/5 pb-3 font-mono text-xs uppercase text-[#ffc08d]">
                      Public feedback to issue owner
                    </h3>
                    {selectedReport.publicFeedback?.length ? (
                      <div className="space-y-3">
                        {selectedReport.publicFeedback.map((feedback) => (
                          <div key={feedback.id} className="rounded border border-white/10 bg-black/30 p-3">
                            <p className="text-sm leading-6 text-white">{feedback.message}</p>
                            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#dbc2b0]/60">
                              {feedback.author} | {new Date(feedback.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-[#dbc2b0]">
                        No public feedback has been added yet. Citizens can add feedback from the
                        public proof page before the issue owner closes the case.
                      </p>
                    )}
                  </section>
                </>
              ) : (
                <div className="cp-cyber-card rounded-lg p-8 text-center">
                  <p className="text-xl font-semibold text-white">{tr("warranty")}: {tr("notActive")}</p>
                  <Link href="/contractor" className="mt-4 inline-flex rounded bg-[#ffc08d] px-5 py-3 font-semibold text-[#4c2700]">
                    {tr("submitProofActivateWarranty")}
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

function subscribeUrl() {
  return () => {};
}

function getIssueIdFromUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("issue") ?? "";
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

function WarrantyBadge({
  report,
  activeText,
  pendingText,
  notActiveText,
  closedText,
}: {
  report: CivicReport;
  activeText: string;
  pendingText: string;
  notActiveText: string;
  closedText: string;
}) {
  const active = report.status === "UNDER_WARRANTY" || report.status === "REPEAT_FAILURE" || report.warrantyStatus === "ACTIVE";
  const pending = ["REPAIR_SUBMITTED", "ADMIN_APPROVED", "ASSIGNED_TO_CONTRACTOR", "WORK_ACCEPTED", "WORK_STARTED", "WORK_COMPLETED"].includes(report.status);
  const closed = report.status === "CLOSED";

  return (
    <span
      className={`shrink-0 rounded border px-2 py-1 font-mono text-[10px] uppercase ${
        closed
          ? "border-[#00eb88]/30 bg-[#00eb88]/10 text-[#00eb88]"
          : active
          ? "border-[#00eb88]/30 bg-[#00eb88]/10 text-[#00eb88]"
          : pending
            ? "border-[#ffc08d]/30 bg-[#ffc08d]/10 text-[#ffc08d]"
            : "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]"
      }`}
    >
      {closed ? closedText : active ? activeText : pending ? pendingText : notActiveText}
    </span>
  );
}

function IssueProgressPanel({ report }: { report: CivicReport }) {
  const isPowerOutage = report.issueCategory === "POWER_OUTAGE";
  const approved =
    report.status === "ADMIN_APPROVED" ||
    report.status === "UNDER_WARRANTY" ||
    report.status === "REPEAT_FAILURE" ||
    report.status === "CLOSED";
  const hasRepairProof = Boolean(report.repairImageName || report.repairImageDataUrl || report.repairProofAt);
  const crewProgress = Boolean(
    report.utilityRestoration?.progressStage &&
      !report.utilityRestoration.progressStage.toLowerCase().includes("fault reported")
  );
  const steps = isPowerOutage
    ? [
        {
          label: "Outage reported",
          detail: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "Citizen power issue recorded",
          done: true,
        },
        {
          label: "Fault triaged",
          detail: `${report.confidence}% confidence | ${report.utilityRestoration?.cause ?? report.severity}`,
          done: true,
        },
        {
          label: "Crew / restoration progress",
          detail: report.utilityRestoration?.progressStage ?? "Waiting for electricity crew update",
          done: crewProgress || hasRepairProof,
        },
        {
          label: "Power restored proof",
          detail: hasRepairProof ? "Restoration proof uploaded" : "Waiting for restoration proof",
          done: hasRepairProof,
        },
        {
          label: "Issuer confirmed",
          detail: approved
            ? "Power restoration accepted and monitoring active"
            : "Pending issuer / area confirmation",
          done: approved,
        },
      ]
    : [
        {
          label: "Report raised",
          detail: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "Citizen issue recorded",
          done: true,
        },
        {
          label: "AI verified",
          detail: `${report.confidence}% confidence | ${report.severity} severity`,
          done: true,
        },
        {
          label: "Contractor proof uploaded",
          detail: hasRepairProof ? "After-repair evidence attached" : "Waiting for repair proof",
          done: hasRepairProof,
        },
        {
          label: "Issuer approved",
          detail: approved ? "Repair accepted by issue owner" : "Pending owner review",
          done: approved,
        },
        {
          label: "Warranty active",
          detail: report.warrantyStatus === "ACTIVE" ? `${report.warrantyDaysLeft ?? report.warrantyPeriodDays ?? 90} days monitoring` : "Activates after citizen confirmation",
          done: report.warrantyStatus === "ACTIVE",
        },
      ];
  const completed = steps.filter((step) => step.done).length;

  return (
    <section id="issue-progress" className="cp-cyber-card cp-cyber-card-hover scroll-mt-24 rounded-lg p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#00dbe9]">
            Notification Linked Progress
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Issue progress for {report.id}</h3>
          <p className="mt-2 text-sm leading-6 text-[#dbc2b0]">
            This is the same lifecycle citizens see after clicking a bell notification.
          </p>
        </div>
        <span className="rounded border border-[#00eb88]/25 bg-[#00eb88]/10 px-3 py-2 font-mono text-xs font-bold text-[#00eb88]">
          {completed}/{steps.length} steps complete
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className={`relative rounded-lg border p-4 ${
              step.done
                ? "border-[#00eb88]/30 bg-[#00eb88]/10"
                : "border-white/10 bg-black/25"
            }`}
          >
            <div
              className={`mb-3 grid h-8 w-8 place-items-center rounded-full border font-mono text-xs font-bold ${
                step.done
                  ? "border-[#00eb88]/40 bg-[#00eb88]/15 text-[#00eb88]"
                  : "border-[#dbc2b0]/20 bg-white/[0.04] text-[#dbc2b0]/60"
              }`}
            >
              {index + 1}
            </div>
            <p className="text-sm font-semibold text-white">{step.label}</p>
            <p className="mt-2 text-xs leading-5 text-[#dbc2b0]/75">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function UtilityRestorationPanel({ report }: { report: CivicReport }) {
  const restoration = report.utilityRestoration;

  if (!restoration) {
    return null;
  }

  return (
    <section className="cp-cyber-card cp-cyber-card-hover rounded-lg border-[#ffc08d]/20 bg-[#ffc08d]/5 p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-[#ffc08d]">
            <Zap size={15} />
            Power restoration tracker
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Transformer / feeder resolution status</h3>
          <p className="mt-2 text-sm leading-6 text-[#dbc2b0]">
            Citizens can see why power failed, who is handling it, and when restoration is expected.
          </p>
        </div>
        <span className="rounded border border-[#00dbe9]/25 bg-[#00dbe9]/10 px-3 py-2 font-mono text-xs font-bold text-[#7df4ff]">
          ETA: {restoration.estimatedRestoration}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Info label="Cause" value={restoration.cause} />
        <Info label="Affected area" value={restoration.affectedArea} />
        <Info label="Department" value={restoration.department} />
        <Info label="Current stage" value={restoration.progressStage} />
      </div>
      <div className="mt-4 rounded border border-[#ffc08d]/20 bg-black/30 p-4 text-sm leading-6 text-[#ffdcc2]">
        {restoration.citizenUpdate}
      </div>
    </section>
  );
}

function statusLabel(report: CivicReport, tr: (key: "active" | "pending" | "notActive" | "openIssues" | "repairSubmitted" | "repeatFailure") => string) {
  const labels = {
    OPEN: tr("openIssues"),
    PENDING_PROOF: tr("pending"),
    ASSIGNED_TO_CONTRACTOR: "Assigned",
    WORK_ACCEPTED: "Accepted",
    WORK_STARTED: "Work started",
    WORK_COMPLETED: "Work completed",
    REPAIR_SUBMITTED: tr("repairSubmitted"),
    ADMIN_APPROVED: "Admin approved",
    REPAIR_REJECTED: "Proof rejected",
    CITIZEN_DISPUTED: "Citizen disputed",
    UNDER_WARRANTY: tr("active"),
    REPEAT_FAILURE: tr("repeatFailure"),
    CLOSED: "Closed",
  };

  return labels[report.status];
}

function warrantyLabel(report: CivicReport, tr: (key: "notActive" | "pending" | "warranty") => string) {
  if (report.status === "CLOSED") {
    return report.warrantyStatus === "ACTIVE" ? "Closed + Warranty Active" : "Closed";
  }

  if (report.status === "UNDER_WARRANTY" || report.status === "REPEAT_FAILURE") {
    return `${report.warrantyDaysLeft ?? report.warrantyPeriodDays ?? 90} ${tr("warranty")}`;
  }

  if (report.status === "REPAIR_SUBMITTED") {
    return tr("pending");
  }

  if (report.status === "ADMIN_APPROVED") {
    return "Awaiting citizen confirmation";
  }

  return tr("notActive");
}

function sortWarrantyReports(a: CivicReport, b: CivicReport) {
  const priority = (report: CivicReport) => {
    if (report.status === "REPAIR_SUBMITTED" && (report.repairImageDataUrl || report.repairImageName)) {
      return 0;
    }

    if (report.status === "ADMIN_APPROVED") {
      return 1;
    }

    if (report.status === "UNDER_WARRANTY" || report.status === "REPEAT_FAILURE" || report.warrantyStatus === "ACTIVE") {
      return 2;
    }

    if (report.status === "REPAIR_SUBMITTED") {
      return 3;
    }

    if (["PENDING_PROOF", "OPEN", "ASSIGNED_TO_CONTRACTOR", "WORK_ACCEPTED", "WORK_STARTED", "WORK_COMPLETED", "REPAIR_REJECTED", "CITIZEN_DISPUTED"].includes(report.status)) {
      return 4;
    }

    return 5;
  };

  const time = (report: CivicReport) =>
    Date.parse(report.repairProofAt ?? report.warrantyActivatedAt ?? report.updatedAt ?? report.createdAt ?? "") || 0;

  return priority(a) - priority(b) || time(b) - time(a) || a.id.localeCompare(b.id);
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/35 p-3">
      <p className="font-mono text-[10px] uppercase text-[#dbc2b0]/60">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function warrantyRiskPanelTone(level?: AiWarrantyRiskResult["riskLevel"]) {
  switch (level) {
    case "CRITICAL":
    case "HIGH":
      return "border-[#ffb4ab]/35 bg-[#ffb4ab]/10 text-[#ffdad6]";
    case "MEDIUM":
      return "border-[#ffc08d]/35 bg-[#ffc08d]/10 text-[#ffdcc2]";
    case "LOW":
      return "border-[#00eb88]/30 bg-[#00eb88]/10 text-[#d3ffe7]";
    default:
      return "border-[#00dbe9]/20 bg-[#00dbe9]/10 text-[#d3fbff]";
  }
}

function AgentAuditPanel({ audit }: { audit: AiAgentAudit }) {
  return (
    <div className="mt-4 rounded border border-white/10 bg-black/25 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
          Explainability audit
        </p>
        <span className="rounded border border-white/10 bg-black/35 px-2 py-1 font-mono text-[10px] uppercase">
          {audit.mode} | {audit.providerLabel}
        </span>
      </div>
      {audit.fallbackReason && <p className="mt-2 text-xs leading-5 text-[#ffc08d]">{audit.fallbackReason}</p>}
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {audit.retrievedRules.slice(0, 4).map((rule) => (
          <div key={rule.id} className="rounded border border-white/10 bg-black/25 p-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-white">{rule.title}</p>
              <span className="font-mono text-[10px] text-[#00eb88]">{rule.matchScore}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#dbc2b0]/75">{rule.ruleText}</p>
            <p className="mt-1 font-mono text-[10px] uppercase text-[#dbc2b0]/50">
              {rule.category} | SLA {rule.slaHours ?? "contextual"}h | Warranty {rule.warrantyDays ?? "contextual"}d
            </p>
          </div>
        ))}
      </div>
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

function GoogleMapPreview({
  report,
  exactLocationLabel,
  openMapsLabel,
  pendingLocationLabel,
}: {
  report: CivicReport;
  exactLocationLabel: string;
  openMapsLabel: string;
  pendingLocationLabel: string;
}) {
  if (!report.latitude || !report.longitude) {
    return (
      <div className="rounded border border-white/10 bg-black/30 p-4 text-sm text-[#dbc2b0]">
        {pendingLocationLabel}
      </div>
    );
  }

  const mapUrl =
    report.mapUrl ??
    `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`;
  const embedUrl = `https://maps.google.com/maps?q=${report.latitude},${report.longitude}&z=16&output=embed`;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="overflow-hidden rounded-lg border border-[#00dbe9]/20 bg-black/35">
        <iframe
          title={`Google Maps location for ${report.id}`}
          src={embedUrl}
          className="h-64 w-full grayscale-[0.12]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="rounded border border-white/10 bg-black/25 p-4">
        <p className="font-mono text-xs uppercase text-[#00dbe9]">{exactLocationLabel}</p>
        <p className="mt-2 text-sm leading-6 text-[#dbc2b0]">{report.location}</p>
        <p className="mt-3 font-mono text-xs text-[#ffc08d]">
          {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
        </p>
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-4 py-3 text-sm font-semibold text-[#00dbe9] transition hover:bg-[#00dbe9]/15"
        >
          {openMapsLabel}
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

function fallbackHistory(report: CivicReport) {
  const repaired = report.status === "UNDER_WARRANTY" || report.status === "REPEAT_FAILURE" || report.warrantyStatus === "ACTIVE";

  return [
    {
      label: "Citizen report created",
      detail: `${report.title} submitted from ${report.location}.`,
      time: "Demo timeline",
    },
    {
      label: repaired ? "Warranty activated" : "Awaiting contractor repair",
      detail:
        repaired
          ? "Contractor proof passed audit and warranty monitoring is active."
          : "No repair warranty has been activated for this case yet.",
      time: "Demo timeline",
    },
    ...(report.status === "CLOSED"
      ? [
          {
            label: "Issue closed by report issuer",
            detail: report.closureNote ?? "Repair accepted and kept in public history.",
            time: report.closedAt ? new Date(report.closedAt).toLocaleString() : "Demo timeline",
          },
        ]
      : []),
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
