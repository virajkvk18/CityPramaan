/* eslint-disable @next/next/no-img-element */
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Building2,
  Camera,
  CheckCircle2,
  ExternalLink,
  Hammer,
  LayoutDashboard,
  MapPin,
  Router,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  UploadCloud,
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
  readFileAsDataUrl,
  subscribeLocalReports,
  upsertLocalReport,
} from "@/src/lib/report-storage";
import { useLanguage } from "@/src/lib/use-language";
import { useDetectedLocationDisplay } from "@/src/lib/use-detected-location";

const activeStatuses: CivicReport["status"][] = [
  "OPEN",
  "PENDING_PROOF",
  "REPAIR_SUBMITTED",
  "UNDER_WARRANTY",
  "REPEAT_FAILURE",
];

export default function ContractorPage() {
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
  const repairQueue = allReports.filter((report) => activeStatuses.includes(report.status));
  const [selectedReportId, setSelectedReportId] = useState(repairQueue[0]?.id ?? "");
  const selectedReport = repairQueue.find((report) => report.id === selectedReportId) ?? repairQueue[0];
  const [repairImage, setRepairImage] = useState("");
  const [repairImageDataUrl, setRepairImageDataUrl] = useState("");
  const [repairImageLoading, setRepairImageLoading] = useState(false);
  const [audited, setAudited] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [auditProcessing, setAuditProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState(
    `${t("selectedCase")}, ${t("uploadAfterRepairEvidence")}, then submit proof for issuer approval.`
  );

  async function handleRepairFile(file?: File) {
    if (!file) {
      return;
    }

    setRepairImage(file.name);
    setRepairImageDataUrl("");
    setRepairImageLoading(true);
    setAudited(false);
    setSubmittedId("");
    setActionMessage("Preparing repair proof image for public record...");

    try {
      setRepairImageDataUrl(await readFileAsDataUrl(file));
      setActionMessage(`${t("afterRepairProofAttached")}. ${t("runAiRepairAudit")} / submit proof for issuer approval.`);
    } catch {
      setRepairImage("");
      setRepairImageDataUrl("");
      setActionMessage("Could not prepare this image. Please choose another repair proof photo.");
    } finally {
      setRepairImageLoading(false);
    }
  }

  function runRepairAudit() {
    if (!repairImage || !selectedReport) {
      setActionMessage(t("uploadAfterRepairEvidence"));
      return;
    }

    if (repairImageLoading || !repairImageDataUrl) {
      setActionMessage("Repair proof image is still being prepared. Please wait a moment.");
      return;
    }

    setAudited(false);
    setAuditProcessing(true);
    setActionMessage(t("aiRepairAudit"));

    window.setTimeout(() => {
      setAudited(true);
      setAuditProcessing(false);
      setActionMessage(`${t("aiRepairAudit")} ${t("ready")}. Proof can now be sent for issuer approval.`);
    }, 900);
  }

  function submitRepairProof() {
    if (!selectedReport) {
      setActionMessage("Select a report first, then upload after-repair proof.");
      return;
    }

    if (submittedId === selectedReport.id) {
      setActionMessage(`${t("repairProof")} submitted. Waiting for issuer approval on ${t("publicProof")}.`);
      return;
    }

    if (!repairImage) {
      setActionMessage(t("uploadAfterRepairEvidence"));
      return;
    }

    if (repairImageLoading || !repairImageDataUrl) {
      setActionMessage("Repair proof image is still being prepared. Please wait a moment.");
      return;
    }

    if (!audited) {
      setAudited(false);
      setAuditProcessing(true);
      setActionMessage(`${t("aiRepairAudit")}... preparing proof for issuer approval.`);

      window.setTimeout(() => {
        setAudited(true);
        setAuditProcessing(false);
        submitProofForApproval(selectedReport);
      }, 900);
      return;
    }

    submitProofForApproval(selectedReport);
  }

  function submitProofForApproval(report: CivicReport) {
    const now = new Date();
    const tx = `0x93ac...${report.id.replace("CP-", "")}fd`;
    const isPowerOutage = report.issueCategory === "POWER_OUTAGE";
    const reportCity = getCityByKey(report.cityKey ?? selectedCity.key);
    const repairAudit = {
      materialMatch: isPowerOutage ? "Restoration signal verified" : "95.4%",
      repairIntegrity: isPowerOutage ? "Power Restored" : "High",
      geoVariance: "+/-0.5 m",
      beforeAfterDelta: isPowerOutage ? "Outage area restored" : "84% visible damage reduction",
      closureConfidence: isPowerOutage ? "94.1%" : "92.7%",
      visibleDamageRemaining: isPowerOutage ? "No active outage signal" : "Low",
      recommendation:
        isPowerOutage
          ? "Utility restoration proof indicates the transformer / feeder fault is resolved. Case is ready for issuer confirmation and public restoration update."
          : "AI compared the citizen issue photo with contractor repair proof. The damaged surface appears filled, GPS variance is low, and the case is ready for citizen owner verification.",
    };
    const updated = appendReportEvent(
      {
        ...report,
        cityKey: reportCity.key,
        contractor: reportCity.contractor,
        status: "REPAIR_SUBMITTED",
        warrantyDaysLeft: null,
        warrantyActivatedAt: undefined,
        warrantyExpiresAt: undefined,
        repairProofAt: now.toISOString(),
        repairImageName: repairImage || "contractor-after-repair.jpg",
        repairImageDataUrl,
        repairTxHash: tx,
        txHash: report.txHash || tx,
        utilityRestoration: report.utilityRestoration
          ? {
              ...report.utilityRestoration,
              estimatedRestoration: "Pending issuer confirmation",
              progressStage: "Restoration proof submitted",
              citizenUpdate:
                "Repair crew has uploaded restoration proof. Issuer approval will confirm power restoration and activate monitoring.",
            }
          : undefined,
        repairAudit,
      },
      {
        label: isPowerOutage ? "Power restoration proof submitted" : "Repair proof submitted",
        detail: isPowerOutage
          ? `${reportCity.contractor} uploaded transformer / feeder restoration proof for ${report.location}. Waiting for issuer confirmation.`
          : `${reportCity.contractor} uploaded after-repair proof for ${report.location}. Waiting for report issuer approval before warranty activation.`,
        time: now.toLocaleString(),
        tx,
      }
    );

    upsertLocalReport(updated);
    setSubmittedId(report.id);
    setActionMessage(`${t("repairProof")} submitted. Status is now ${t("repairSubmitted")} / ${t("pending")}. Issuer must approve it from ${t("publicProof")}.`);
  }

  function chooseCity(cityKey: CityKey) {
    setSelectedCityKey(cityKey);
    setRepairImage("");
    setRepairImageDataUrl("");
    setRepairImageLoading(false);
    setAudited(false);
    setSubmittedId("");
    setActionMessage(`${t("city")} ${t("active")}. ${t("selectedCase")} / ${t("uploadAfterRepairEvidence")}.`);
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
          <BrandLogo size="sm" subtitle={t("contractorRepairAudit")} />
        </div>
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <NotificationBell />
          <button className="hidden h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0]/70 transition hover:text-[#00eb88] sm:grid">
            <Settings size={16} />
          </button>
          <ThemeToggle />
          <LanguageSelector compact />
          <button className="hidden rounded border border-[#ffc08d]/50 bg-[#ffc08d]/10 px-4 py-2 font-mono text-xs text-[#ffc08d] transition hover:bg-[#ffc08d]/20 sm:block">
            {t("connectWallet")}
          </button>
        </div>
      </header>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[#ff9933]/15 bg-[linear-gradient(180deg,rgba(255,153,51,0.08),rgba(0,0,0,0.5)_22%,rgba(0,219,233,0.045))] px-4 pb-5 pt-20 shadow-[5px_0_24px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:flex">
        <div className="mt-2 border-b border-white/10 px-2 pb-5">
          <BrandLogo size="sm" subtitle={t("verifiedRepairs")} />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label={t("commandCenter")} />
          <NavItem href="/contractor" icon={<BadgeCheck size={18} />} label={t("verifiedRepairs")} active />
          <NavItem href="/report" icon={<Camera size={18} />} label={t("reportIssue")} />
          <NavItem href="/pending" icon={<ShieldCheck size={18} />} label={t("pendingProof")} />
          <NavItem href="/warranty" icon={<BarChart3 size={18} />} label={t("warrantyScanner")} />
        </nav>

        <Link
          href="/report"
          className="btn-primary-shimmer grid rounded bg-[#ffc08d] px-4 py-3 text-center font-mono text-xs font-semibold text-[#4c2700]"
        >
          {t("submitReport")}
        </Link>

        <div className="mt-5 border-t border-white/5 pt-4">
          <NavItem href="/" icon={<Router size={15} />} label={t("systemStatus")} small />
          <NavItem href="/about" icon={<BookOpen size={15} />} label={t("documentation")} small />
        </div>
      </aside>

      <section className="relative z-10 min-h-screen px-4 pb-10 pt-24 md:ml-64 md:px-8 md:pt-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-7 flex flex-col justify-between gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-end">
            <div>
              <Link href="/" className="hidden">
                <ArrowLeft size={16} />
                {t("backToCommandCenter")}
              </Link>
              <p className="font-mono text-xs uppercase text-[#00dbe9]">
                {t("repairProof")} | {cityDisplay.cityName} {t("nodeSynced")}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white sm:text-5xl">
                {t("contractorRepairAudit")}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#dbc2b0]">
                {t("selectedCase")}. {t("issueBefore")}. {t("uploadAfterRepairEvidence")}.
                {t("runAiRepairAudit")}. Submit proof for issuer approval, then warranty activates from Public Proof.
              </p>
            </div>
            <select
              value={selectedCity.key}
              onChange={(event) => chooseCity(event.target.value as CityKey)}
              className="input-recessed rounded px-4 py-3 font-mono text-sm text-white"
            >
              {demoCities.map((city) => (
                <option key={city.key} value={city.key} className="bg-[#050505] text-white">
                  {cityDisplay.isDetectedForSelected && city.key === selectedCity.key
                    ? `${cityDisplay.cityName} GPS`
                    : city.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <aside className="flex flex-col gap-6 xl:col-span-4">
              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs uppercase text-[#00dbe9]">{t("activeReports")}</p>
                    <p className="mt-1 text-xs text-[#dbc2b0]/70">{repairQueue.length} {t("publicIssueHistory")}</p>
                  </div>
                  <span className="rounded border border-[#00eb88]/25 bg-[#00eb88]/10 px-2 py-1 font-mono text-[10px] text-[#00eb88]">
                    {t("active")}
                  </span>
                </div>

                <div className="space-y-3">
                  {repairQueue.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => {
                        setSelectedReportId(report.id);
                        setRepairImage("");
                        setRepairImageDataUrl("");
                        setRepairImageLoading(false);
                        setAudited(false);
                        setSubmittedId("");
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
                        <StatusBadge
                          status={report.status}
                          labels={{
                            OPEN: t("openIssues"),
                            PENDING_PROOF: t("pendingProof"),
                            REPAIR_SUBMITTED: t("repairSubmitted"),
                            UNDER_WARRANTY: t("underWarranty"),
                            REPEAT_FAILURE: t("repeatFailure"),
                            CLOSED: "Closed",
                          }}
                        />
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-xs text-[#dbc2b0]/70">
                        <MapPin size={13} />
                        {report.location}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="cp-cyber-card cp-cyber-card-hover relative overflow-hidden rounded-lg p-6">
                <div className="pointer-events-none absolute right-4 top-4 text-white/5">
                  <BadgeCheck size={82} />
                </div>
                <div className="relative flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-lg border-2 border-[#00dbe9] bg-[#00dbe9]/10 text-[#00dbe9]">
                    <Building2 size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{selectedCity.contractor}</h3>
                    <p className="mt-1 font-mono text-sm text-[#00dbe9]">ID: CNT-44X-99</p>
                  </div>
                </div>

                <div className="relative mt-6 grid grid-cols-2 gap-3">
                  <Metric icon={<ShieldCheck size={15} />} label={t("status")} value={t("nodeSynced")} tone="emerald" />
                  <Metric icon={<Star size={15} />} label="SLA" value="4.92 / 5.0" tone="amber" />
                  <Metric icon={<Hammer size={15} />} label={t("activeReports")} value={String(repairQueue.length).padStart(2, "0")} tone="cyan" />
                  <Metric icon={<BadgeCheck size={15} />} label="SLA" value="96%" tone="emerald" />
                </div>
              </section>
            </aside>

            <section className="flex flex-col gap-6 xl:col-span-8">
              {selectedReport ? (
                <>
                  <div className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <p className="font-mono text-xs uppercase text-[#ffc08d]">
                          {t("selectedCase")} | {selectedReport.id}
                        </p>
                        <h2 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                          <Sparkles className="text-[#00dbe9]" size={22} />
                          {selectedReport.title}
                        </h2>
                        <p className="mt-2 flex items-center gap-2 text-sm text-[#dbc2b0]">
                          <MapPin size={15} />
                          {selectedReport.location}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-72">
                        <Info label={t("severity")} value={selectedReport.severity} />
                        <Info label={t("aiConfidence")} value={`${selectedReport.confidence}%`} />
                        <Info label={t("ward")} value={selectedReport.ward} />
                        <Info label="SLA" value={`${selectedReport.slaHours ?? 72} hrs`} />
                      </div>
                    </div>

                    <LocationProofStrip report={selectedReport} />

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <EvidenceBox
                        label={t("issueBefore")}
                        image={selectedReport.issueImageDataUrl}
                        imageName={selectedReport.issueImageName}
                        fallback="pothole"
                        fallbackTitle={t("issueImageVisible")}
                        fallbackDetail={`${t("contractor")} + ${t("publicProof")}`}
                      />

                      <label
                        className={`relative min-h-72 cursor-pointer overflow-hidden rounded-lg border bg-black/45 transition hover:bg-[#00dbe9]/5 ${
                          repairImage
                            ? "border-[#00eb88]/50"
                            : "border-dashed border-[#00dbe9]/45"
                        } ${auditProcessing ? "scan-active" : ""}`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => void handleRepairFile(event.target.files?.[0])}
                        />

                        {repairImage ? (
                          <>
                            {repairImageDataUrl ? (
                              <img
                                src={repairImageDataUrl}
                                alt="Uploaded repair proof"
                                className="absolute inset-0 h-full w-full object-cover opacity-75"
                              />
                            ) : (
                              <div className="absolute inset-0 evidence-asphalt opacity-75" />
                            )}
                            <div className="absolute inset-0 bg-black/35" />
                            <div className="scanner-line z-30" />
                            <div className="absolute bottom-3 left-3 right-3 rounded border border-[#00eb88]/20 bg-black/65 p-3">
                              <p className="font-semibold text-[#00eb88]">{repairImage}</p>
                              <p className="mt-1 font-mono text-xs text-[#dbc2b0]/70">
                                {repairImageLoading ? "Preparing public proof image..." : `${t("afterRepairProofAttached")} ${selectedReport.id}`}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="grid h-full min-h-72 place-items-center p-6 text-center">
                            <div>
                              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#00dbe9]/35 bg-[#00dbe9]/10 text-[#00dbe9]">
                                <UploadCloud size={28} />
                              </div>
                              <p className="mt-4 font-mono text-sm text-[#00dbe9]">{t("uploadAfterRepairEvidence")}</p>
                              <p className="mt-1 text-xs text-[#dbc2b0]/55">{t("uploadAfterRepairHint")}</p>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={runRepairAudit}
                        disabled={!repairImage || repairImageLoading || auditProcessing}
                        className="flex flex-1 items-center justify-center gap-2 rounded border border-[#00dbe9] bg-[#00dbe9]/10 px-4 py-3 font-mono text-xs text-[#00dbe9] transition hover:bg-[#00dbe9]/15 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Sparkles size={16} className={auditProcessing || repairImageLoading ? "animate-spin" : ""} />
                        {repairImageLoading ? "Preparing image..." : auditProcessing ? `${t("aiRepairAudit")}...` : audited ? t("ready") : t("runAiRepairAudit")}
                      </button>
                      <button
                        type="button"
                        onClick={submitRepairProof}
                        disabled={repairImageLoading || auditProcessing}
                        className="btn-primary-shimmer relative z-20 flex flex-1 items-center justify-center gap-2 rounded bg-[#00eb88] px-4 py-3 font-mono text-xs font-semibold text-[#00210e] transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ShieldCheck size={16} className={auditProcessing || repairImageLoading ? "animate-spin" : ""} />
                        {repairImageLoading ? "Preparing image..." : auditProcessing ? `${t("aiRepairAudit")}...` : "Submit Proof for Approval"}
                      </button>
                    </div>

                    <p className="mt-3 rounded border border-[#ffc08d]/20 bg-[#ffc08d]/10 px-3 py-2 text-xs text-[#ffdcc2]">
                      {actionMessage}
                    </p>
                  </div>

                  {(auditProcessing || audited || submittedId === selectedReport.id) && (
                    <div className="cp-cyber-card rounded-lg border-[#00dbe9]/20 bg-[#00dbe9]/10 p-6">
                      <div className="flex items-center gap-2 text-[#00dbe9]">
                        <Sparkles size={18} className={auditProcessing ? "animate-spin" : ""} />
                        <p className="font-semibold">{t("aiRepairAudit")}</p>
                      </div>

                      {auditProcessing ? (
                        <div className="mt-4 space-y-3">
                          <ProcessingStep label={`${t("issueBefore")} + ${t("contractorProofAfter")}`} />
                          <ProcessingStep label={`${t("mapLocation")} / ${t("repairIntegrity")}`} />
                          <ProcessingStep label="Preparing issuer approval request" />
                        </div>
                      ) : (
                        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                          <Audit label={t("asset")} value="95.4%" tone="emerald" />
                          <Audit label={t("repairIntegrity")} value="High" tone="emerald" />
                          <Audit label={t("geoMatch")} value="+/-0.5 m" tone="cyan" />
                          <Audit label={t("warranty")} value="90 Days" tone="amber" />
                          <Audit label="AI closure confidence" value="92.7%" tone="emerald" />
                          <Audit label="Visible damage left" value="Low" tone="cyan" />
                        </div>
                      )}

                      {submittedId === selectedReport.id && (
                        <div className="mt-5 rounded border border-[#00eb88]/25 bg-[#00eb88]/10 p-4">
                          <div className="flex items-center gap-2 text-[#00eb88]">
                            <CheckCircle2 size={18} />
                            <p className="font-semibold">{t("repairSubmitted")} / {t("pending")}</p>
                          </div>
                          <p className="mt-2 text-sm text-[#dbc2b0]">
                            Contractor proof is now visible in {t("publicProof")}. Issuer approval will activate warranty.
                          </p>
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <Link
                              href="/warranty"
                              className="rounded border border-[#00eb88]/30 bg-[#00eb88]/10 px-4 py-2 text-center text-sm font-semibold text-[#00eb88]"
                            >
                              {t("warrantyScanner")}
                            </Link>
                            <Link
                              href={`/proof/${selectedReport.id}`}
                              className="rounded border border-[#00dbe9]/30 bg-[#00dbe9]/10 px-4 py-2 text-center text-sm font-semibold text-[#00dbe9]"
                            >
                              {t("openPublicProof")}
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="cp-cyber-card rounded-lg p-8 text-center">
                  <p className="text-xl font-semibold text-white">{t("activeReports")}: {t("notActive")}</p>
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

function EvidenceBox({
  label,
  image,
  imageName,
  fallback,
  fallbackTitle,
  fallbackDetail,
}: {
  label: string;
  image?: string;
  imageName?: string;
  fallback: "pothole" | "patch";
  fallbackTitle: string;
  fallbackDetail: string;
}) {
  return (
    <div className="relative min-h-72 overflow-hidden rounded-lg border border-white/10 bg-black/45">
      <div className="absolute left-2 top-2 z-20 flex items-center gap-1 rounded border border-[#ffb4ab]/30 bg-black/80 px-2 py-1 font-mono text-xs text-[#ffb4ab] backdrop-blur">
        <Camera size={14} />
        {label}
      </div>
      {image ? (
        <img src={image} alt={label} className="absolute inset-0 h-full w-full object-cover opacity-75" />
      ) : (
        <>
          <div className="absolute inset-0 evidence-asphalt opacity-75" />
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border ${
              fallback === "patch"
                ? "cp-road-patch h-24 w-44 border-[#00eb88]/35 bg-[#042b18]/85"
                : "cp-road-crater h-24 w-40 border-[#ffb4ab]/40 bg-[#2a0d0d]"
            }`}
          />
        </>
      )}
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute bottom-3 left-3 right-3 rounded border border-white/10 bg-black/65 p-3">
        <p className="font-semibold text-white">{imageName || fallbackTitle}</p>
        <p className="mt-1 font-mono text-xs text-[#dbc2b0]/70">{fallbackDetail}</p>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  labels,
}: {
  status: CivicReport["status"];
  labels: Record<CivicReport["status"], string>;
}) {
  const colors = {
    OPEN: "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]",
    PENDING_PROOF: "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#7df4ff]",
    REPAIR_SUBMITTED: "border-[#ffc08d]/30 bg-[#ffc08d]/10 text-[#ffc08d]",
    UNDER_WARRANTY: "border-[#00eb88]/30 bg-[#00eb88]/10 text-[#00eb88]",
    REPEAT_FAILURE: "border-[#d946ef]/30 bg-[#d946ef]/10 text-[#f0abfc]",
    CLOSED: "border-[#00eb88]/30 bg-[#00eb88]/10 text-[#00eb88]",
  };

  return (
    <span className={`shrink-0 rounded border px-2 py-1 font-mono text-[10px] uppercase ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/35 p-3">
      <p className="font-mono text-[10px] uppercase text-[#dbc2b0]/60">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function LocationProofStrip({ report }: { report: CivicReport }) {
  const coordinates =
    typeof report.latitude === "number" && typeof report.longitude === "number"
      ? `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`
      : "Coordinates pending";
  const mapUrl =
    report.mapUrl ??
    (typeof report.latitude === "number" && typeof report.longitude === "number"
      ? `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`
      : "");

  return (
    <div className="mb-5 grid gap-3 rounded border border-[#00dbe9]/20 bg-[#00dbe9]/10 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#00dbe9]">
          Exact citizen location proof
        </p>
        <p className="mt-2 text-sm leading-6 text-[#d3fbff]">{report.location}</p>
        <p className="mt-1 font-mono text-xs text-[#dbc2b0]/70">{coordinates}</p>
      </div>
      {mapUrl && (
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded border border-[#00dbe9]/35 bg-black/30 px-4 py-3 font-mono text-xs font-semibold text-[#00dbe9] transition hover:bg-[#00dbe9]/10"
        >
          <ExternalLink size={14} />
          Open maps
        </a>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "emerald" | "amber" | "cyan";
}) {
  const colors = {
    emerald: "text-[#00eb88]",
    amber: "text-[#ffc08d]",
    cyan: "text-[#00dbe9]",
  };

  return (
    <div className="rounded border border-white/10 bg-black/35 p-3">
      <span className="mb-1 block font-mono text-[10px] uppercase text-[#dbc2b0]/60">
        {label}
      </span>
      <div className={`flex items-center gap-1 font-mono text-sm font-semibold ${colors[tone]}`}>
        {icon}
        {value}
      </div>
    </div>
  );
}

function Audit({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "amber" | "cyan";
}) {
  const colors = {
    emerald: "border-[#00eb88] text-[#00eb88]",
    amber: "border-[#ffc08d] text-[#ffc08d]",
    cyan: "border-[#00dbe9] text-[#00dbe9]",
  };

  return (
    <div className={`rounded border-l-2 bg-black/50 p-3 ${colors[tone]}`}>
      <p className="font-mono text-[10px] uppercase text-[#dbc2b0]/60">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold">{value}</p>
    </div>
  );
}

function ProcessingStep({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded border border-[#00dbe9]/20 bg-black/35 px-3 py-2 text-sm text-[#dbc2b0]">
      <span className="h-2 w-2 animate-pulse rounded-full bg-[#00dbe9]" />
      {label}
    </div>
  );
}
