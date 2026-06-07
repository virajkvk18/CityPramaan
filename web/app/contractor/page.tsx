/* eslint-disable @next/next/no-img-element */
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
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
import { ImageForensicsPanel } from "@/src/components/proof/ImageForensicsPanel";
import { LanguageSelector } from "@/src/components/layout/LanguageSelector";
import { NotificationBell } from "@/src/components/layout/NotificationBell";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { DEFAULT_CITY_KEY, demoCities, getCityByKey, type CityKey } from "@/src/lib/city-context";
import { getCitySnapshot, setSelectedCityKey, subscribeCity } from "@/src/lib/city-storage";
import { getReportsForCity, type CivicReport, type ContractorProfile } from "@/src/lib/mock-data";
import {
  appendReportEvent,
  getLocalReportsSnapshot,
  readFileAsDataUrl,
  subscribeLocalReports,
} from "@/src/lib/report-storage";
import { mergeReportsById, saveReportEverywhere, watchBackendReports } from "@/src/lib/report-sync";
import { createProofBundleHash, sha256Hex } from "@/src/lib/proof-hashing";
import { useLanguage } from "@/src/lib/use-language";
import { useDetectedLocationDisplay } from "@/src/lib/use-detected-location";
import { getAuthSnapshot, getCurrentUser, roleLabels, subscribeAuth } from "@/src/lib/auth-storage";
import { getContractorsSnapshot, specializationLabels, subscribeContractors } from "@/src/lib/contractor-storage";
import { requestRepairAudit, type AiRepairAuditResult } from "@/src/lib/ai-agents-client";
import { requestImageForensics } from "@/src/lib/image-forensics-client";
import type { ImageForensicsResult } from "@/src/lib/image-forensics-types";
import type { FabricProofMetadata } from "@/src/lib/fabric-proof-service";

const contractorVisibleStatuses: CivicReport["status"][] = [
  "OPEN",
  "PENDING_PROOF",
  "ASSIGNED_TO_CONTRACTOR",
  "WORK_ACCEPTED",
  "WORK_STARTED",
  "WORK_COMPLETED",
  "REPAIR_SUBMITTED",
  "ADMIN_APPROVED",
  "REPAIR_REJECTED",
  "CITIZEN_DISPUTED",
  "REPEAT_FAILURE",
];

const unassignedContractorNames = new Set(["", "not assigned", "awaiting assignment"]);

async function recordProofGuardFabricProof(reportId: string, result: ImageForensicsResult) {
  try {
    const response = await fetch("/api/fabric/proof", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportId,
        eventType: "PROOFGUARD_REPAIR_FORENSICS",
        proofHash: result.blockchainPayload.imageHash || result.imageHash,
        actorRole: "CONTRACTOR",
        organization: "ProofGuard AI",
        status: `${result.blockchainPayload.decision}:${result.blockchainPayload.fraudScore}`,
      }),
    });

    if (!response.ok) {
      console.warn("CityPramaan Fabric ProofGuard repair adapter unavailable:", await response.text());
      return undefined;
    }

    const payload = (await response.json()) as { proof?: FabricProofMetadata };
    return payload.proof;
  } catch (error) {
    console.warn("CityPramaan Fabric ProofGuard repair adapter unavailable:", error);
    return undefined;
  }
}

export default function ContractorPage() {
  const { t } = useLanguage();
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => DEFAULT_CITY_KEY);
  const localReportsSnapshot = useSyncExternalStore(
    subscribeLocalReports,
    getLocalReportsSnapshot,
    () => "[]"
  );
  const authSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => "");
  const contractorsSnapshot = useSyncExternalStore(
    subscribeContractors,
    getContractorsSnapshot,
    () => "[]"
  );
  const currentUser = useMemo(() => getCurrentUser(authSnapshot), [authSnapshot]);
  const contractors = useMemo(
    () => JSON.parse(contractorsSnapshot) as ContractorProfile[],
    [contractorsSnapshot]
  );
  const currentContractor = contractors.find(
    (contractor) =>
      (currentUser?.id && contractor.userId === currentUser.id) ||
      (currentUser?.email && contractor.email.toLowerCase() === currentUser.email.toLowerCase())
  );
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
  const allReports = useMemo(() => {
    return mergeReportsById(
      getReportsForCity(selectedCity.key),
      backendReports,
      localReports
    ).filter((report) => !report.cityKey || report.cityKey === selectedCity.key);
  }, [backendReports, localReports, selectedCity.key]);
  const repairQueue = allReports.filter(
    (report) =>
      contractorVisibleStatuses.includes(report.status) &&
      isVisibleToContractor(report, currentContractor)
  );
  const [selectedReportId, setSelectedReportId] = useState(repairQueue[0]?.id ?? "");
  const selectedReport = repairQueue.find((report) => report.id === selectedReportId) ?? repairQueue[0];
  const [repairImage, setRepairImage] = useState("");
  const [repairImageFile, setRepairImageFile] = useState<File | undefined>();
  const [repairImageDataUrl, setRepairImageDataUrl] = useState("");
  const [repairImageForensics, setRepairImageForensics] = useState<ImageForensicsResult | null>(null);
  const [repairForensicsProcessing, setRepairForensicsProcessing] = useState(false);
  const [repairNotes, setRepairNotes] = useState("");
  const [repairImageLoading, setRepairImageLoading] = useState(false);
  const [audited, setAudited] = useState(false);
  const [repairAuditResult, setRepairAuditResult] = useState<AiRepairAuditResult | null>(null);
  const [submittedId, setSubmittedId] = useState("");
  const [submittedTxUrl, setSubmittedTxUrl] = useState("");
  const [auditProcessing, setAuditProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState(
    `${t("selectedCase")}, ${t("uploadAfterRepairEvidence")}, then submit proof for issuer approval.`
  );
  const displayedRepairAudit = repairAuditResult ?? selectedReport?.repairAudit ?? null;

  function updateWorkStatus(report: CivicReport, stage: "accepted" | "started" | "completed") {
    const now = new Date();
    const stageConfig = {
      accepted: {
        field: "acceptedAt",
        label: "Contractor accepted work",
        detail: `${report.contractor} accepted the assigned work for ${report.location}.`,
      },
      started: {
        field: "workStartedAt",
        label: "Repair work started",
        detail: `${report.contractor} started repair work at ${report.location}.`,
      },
      completed: {
        field: "workCompletedAt",
        label: "Repair work completed",
        detail: `${report.contractor} marked field work complete and must upload proof for admin verification.`,
      },
    }[stage];

    const updated = appendReportEvent(
      {
        ...report,
        status:
          stage === "accepted"
            ? "WORK_ACCEPTED"
            : stage === "started"
              ? "WORK_STARTED"
              : stage === "completed"
                ? "WORK_COMPLETED"
                : report.status,
        [stageConfig.field]: now.toISOString(),
      },
      {
        label: stageConfig.label,
        detail: stageConfig.detail,
        time: now.toLocaleString(),
        tx: `0xwork...${report.id.replace("CP-", "")}${stage}`,
      }
    );

    void saveReportEverywhere(updated);
    setActionMessage(`${stageConfig.label}. Citizen, Ward Admin, and Public Proof timeline are updated.`);
  }

  async function runRepairImageForensics({
    report = selectedReport,
    file = repairImageFile,
    imageName = repairImage,
    imageDataUrl = repairImageDataUrl,
  }: {
    report?: CivicReport;
    file?: File;
    imageName?: string;
    imageDataUrl?: string;
  } = {}) {
    if (!report || !imageDataUrl) {
      return null;
    }

    setRepairForensicsProcessing(true);
    setActionMessage("ProofGuard AI is checking repair proof authenticity, reuse, metadata, and before/after consistency...");

    try {
      const result = await requestImageForensics({
        proofType: "CONTRACTOR_REPAIR",
        file,
        imageName: imageName || "contractor-repair-proof.jpg",
        imageDataUrl,
        cityReports: allReports,
        report,
        uploadedLatitude: report.latitude,
        uploadedLongitude: report.longitude,
        complaintLatitude: report.latitude,
        complaintLongitude: report.longitude,
        beforeImageDataUrl: report.issueImageDataUrl,
      });

      setRepairImageForensics(result);
      setActionMessage(
        result.decision === "ACCEPT"
          ? `ProofGuard AI accepted repair proof. Fraud score ${result.fraudScore}/100. Run repair audit or submit for approval.`
          : result.decision === "REJECT"
            ? `ProofGuard AI rejected repair proof. Fraud score ${result.fraudScore}/100. Upload a fresh repair photo.`
            : `ProofGuard AI marked repair proof for manual review. Fraud score ${result.fraudScore}/100. Ward Admin must verify before approval.`
      );
      return result;
    } finally {
      setRepairForensicsProcessing(false);
    }
  }

  async function handleRepairFile(file?: File) {
    if (!file) {
      return;
    }

    setRepairImage(file.name);
    setRepairImageFile(file);
    setRepairImageDataUrl("");
    setRepairImageForensics(null);
    setRepairForensicsProcessing(false);
    setRepairImageLoading(true);
    setAudited(false);
    setRepairAuditResult(null);
    setSubmittedId("");
    setSubmittedTxUrl("");
    setActionMessage("Preparing repair proof image for public record...");

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setRepairImageDataUrl(dataUrl);
      setRepairImageLoading(false);
      await runRepairImageForensics({
        report: selectedReport,
        file,
        imageName: file.name,
        imageDataUrl: dataUrl,
      });
    } catch {
      setRepairImage("");
      setRepairImageFile(undefined);
      setRepairImageDataUrl("");
      setRepairImageForensics(null);
      setActionMessage("Could not prepare this image. Please choose another repair proof photo.");
    } finally {
      setRepairImageLoading(false);
    }
  }

  async function performRepairAudit(report = selectedReport) {
    if (!repairImage || !report) {
      setActionMessage(t("uploadAfterRepairEvidence"));
      return null;
    }

    if (repairImageLoading || !repairImageDataUrl) {
      setActionMessage("Repair proof image is still being prepared. Please wait a moment.");
      return null;
    }

    if (repairForensicsProcessing) {
      setActionMessage("ProofGuard AI is still checking this repair proof. Please wait a moment.");
      return null;
    }

    if (repairImageForensics?.decision === "REJECT") {
      setActionMessage("ProofGuard AI rejected this repair image. Upload a fresh proof before running repair audit.");
      return null;
    }

    setAudited(false);
    setRepairAuditResult(null);
    setAuditProcessing(true);
    setActionMessage("Running real AI repair audit with civic RAG rules...");

    try {
      const result = await requestRepairAudit({
        report,
        repairImageName: repairImage,
        repairImageDataUrl,
        repairNotes,
        contractorName: currentContractor?.name ?? report.contractor,
      });

      setRepairAuditResult(result);
      setAudited(true);
      setActionMessage(
        `${t("aiRepairAudit")} ${t("ready")}. AI score ${result.qualityScore}/100, status ${result.status}. Proof can now be sent for issuer approval.`
      );
      return result;
    } finally {
      setAuditProcessing(false);
    }
  }

  function runRepairAudit() {
    void performRepairAudit();
  }

  async function submitRepairProof() {
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

    if (repairForensicsProcessing) {
      setActionMessage("ProofGuard AI is still checking this repair proof. Please wait a moment.");
      return;
    }

    const proofGuard =
      repairImageForensics ??
      (await runRepairImageForensics({
        report: selectedReport,
      }));

    if (proofGuard?.decision === "REJECT") {
      setActionMessage("ProofGuard AI rejected this repair proof. Upload a fresh field photo before submitting.");
      return;
    }

    if (!audited) {
      const result = await performRepairAudit(selectedReport);

      if (result) {
        await submitProofForApproval(selectedReport, result, proofGuard ?? repairImageForensics);
      }
      return;
    }

    await submitProofForApproval(selectedReport, repairAuditResult, proofGuard ?? repairImageForensics);
  }

  async function submitProofForApproval(
    report: CivicReport,
    auditResult = repairAuditResult,
    proofGuard = repairImageForensics
  ) {
    const now = new Date();
    const isPowerOutage = report.issueCategory === "POWER_OUTAGE";
    const reportCity = getCityByKey(report.cityKey ?? selectedCity.key);
    setActionMessage("Creating repair evidence hash and proof bundle...");

    let repairEvidenceHash = "";
    let proofBundleHash = "";
    let tx = "";

    try {
      repairEvidenceHash = await sha256Hex(repairImageDataUrl);
      proofBundleHash = await createProofBundleHash([
        report.id,
        report.evidenceHash,
        repairEvidenceHash,
        report.location,
        report.status,
        now.toISOString(),
      ]);
      tx = proofBundleHash;
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Could not create the repair proof bundle. Please try again."
      );
      return;
    }

    const repairAudit = auditResult
      ? {
          materialMatch: auditResult.materialMatch,
          repairIntegrity: auditResult.repairIntegrity,
          geoVariance: auditResult.geoVariance,
          beforeAfterDelta: auditResult.beforeAfterDelta,
          closureConfidence: auditResult.closureConfidence,
          visibleDamageRemaining: auditResult.visibleDamageRemaining,
          recommendation: auditResult.recommendation,
        }
      : {
          materialMatch: isPowerOutage ? "Restoration signal verified" : "AI audit pending",
          repairIntegrity: isPowerOutage ? "Power Restored" : "Needs issuer review",
          geoVariance: "Location consistency pending",
          beforeAfterDelta: isPowerOutage ? "Outage area restored" : "After-repair proof submitted",
          closureConfidence: isPowerOutage ? "86%" : "74%",
          visibleDamageRemaining: "Unknown",
          recommendation:
            "Repair proof was submitted, but AI audit details were unavailable. Ward Admin should manually verify before approval.",
        };
    const proofGuardFabricProof = proofGuard
      ? await recordProofGuardFabricProof(report.id, proofGuard)
      : undefined;
    let updated = appendReportEvent(
      {
        ...report,
        cityKey: reportCity.key,
        contractor: report.contractor || reportCity.contractor,
        status: "REPAIR_SUBMITTED",
        adminApprovalStatus: "PENDING",
        citizenFinalApproval: "PENDING",
        warrantyStatus: "NOT_ACTIVE",
        workCompletedAt: report.workCompletedAt ?? now.toISOString(),
        warrantyDaysLeft: null,
        warrantyPeriodDays: auditResult?.warrantyDays ?? report.warrantyPeriodDays,
        warrantyActivatedAt: undefined,
        warrantyExpiresAt: undefined,
        repairNotes: repairNotes.trim() || report.repairNotes,
        rejectionReason: undefined,
        repairProofAt: now.toISOString(),
        repairImageName: repairImage || "contractor-after-repair.jpg",
        repairImageDataUrl,
        repairEvidenceHash,
        proofBundleHash,
        repairTxHash: tx,
        txHash: report.txHash || tx,
        repairImageForensics: proofGuard ?? report.repairImageForensics,
        fabricProof: report.fabricProof ?? proofGuardFabricProof,
        fabricProofs: proofGuardFabricProof
          ? [...(report.fabricProofs ?? []), proofGuardFabricProof]
          : report.fabricProofs,
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
          ? `${report.contractor || reportCity.contractor} uploaded transformer / feeder restoration proof for ${report.location}. Waiting for issuer confirmation.`
          : `${report.contractor || reportCity.contractor} uploaded after-repair proof for ${report.location}. Waiting for report issuer approval before warranty activation.${repairNotes.trim() ? ` Notes: ${repairNotes.trim()}` : ""}`,
        time: now.toLocaleString(),
        tx,
      }
    );

    if (proofGuard) {
      updated = appendReportEvent(updated, {
        label: "ProofGuard AI repair forensics",
        detail: `Fraud score ${proofGuard.fraudScore}/100, ${proofGuard.riskLevel}, decision ${proofGuard.decision}. ${proofGuard.forensicSummary}`,
        time: now.toLocaleString(),
        tx: proofGuard.blockchainPayload.imageHash,
      });
    }

    void saveReportEverywhere(updated);
    setSubmittedId(report.id);
    setSubmittedTxUrl("");
    setActionMessage(
      proofGuard?.decision === "MANUAL_REVIEW"
        ? `${t("repairProof")} submitted with ProofGuard manual-review flag and AI/RAG audit. Ward Admin must verify before approval.`
        : `${t("repairProof")} submitted with ProofGuard image forensics and AI/RAG audit. Fabric anchoring is ready for teammate integration.`
    );
  }

  function chooseCity(cityKey: CityKey) {
    setSelectedCityKey(cityKey);
    setRepairImage("");
    setRepairImageFile(undefined);
    setRepairImageDataUrl("");
    setRepairImageForensics(null);
    setRepairForensicsProcessing(false);
    setRepairImageLoading(false);
    setAudited(false);
    setSubmittedId("");
    setSubmittedTxUrl("");
    setActionMessage(`${t("city")} ${t("active")}. ${t("selectedCase")} / ${t("uploadAfterRepairEvidence")}.`);
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
            aria-label={t("backToCommandCenter")}
          >
            <ArrowLeft size={17} />
          </Link>
          <BrandLogo
            size="sm"
            subtitle={currentUser ? roleLabels[currentUser.role] : t("contractorRepairAudit")}
          />
        </div>
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <NotificationBell />
          <button className="hidden h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0]/70 transition hover:text-[#00eb88] sm:grid">
            <Settings size={16} />
          </button>
          <ThemeToggle />
          <LanguageSelector compact />
          <span className="hidden rounded border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-4 py-2 font-mono text-xs text-[#00dbe9] sm:block">
            AI audit active
          </span>
        </div>
      </header>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[#ff9933]/15 bg-[linear-gradient(180deg,rgba(255,153,51,0.08),rgba(0,0,0,0.5)_22%,rgba(0,219,233,0.045))] px-4 pb-5 pt-20 shadow-[5px_0_24px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:flex">
        <div className="mt-2 border-b border-white/10 px-2 pb-5">
          <BrandLogo size="sm" subtitle={t("verifiedRepairs")} />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label={t("commandCenter")} />
          <NavItem href="/contractor" icon={<BadgeCheck size={18} />} label={t("verifiedRepairs")} active />
          <NavItem href="/reports" icon={<ShieldCheck size={18} />} label={t("publicProof")} />
          <NavItem href="/warranty" icon={<BarChart3 size={18} />} label={t("warrantyScanner")} />
        </nav>

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
                        setRepairImageFile(undefined);
                        setRepairImageDataUrl("");
                        setRepairImageForensics(null);
                        setRepairForensicsProcessing(false);
                        setRepairImageLoading(false);
                        setAudited(false);
                        setSubmittedId("");
                        setRepairNotes(report.repairNotes ?? "");
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
                            ASSIGNED_TO_CONTRACTOR: "Assigned",
                            WORK_ACCEPTED: "Accepted",
                            WORK_STARTED: "Work started",
                            WORK_COMPLETED: "Work completed",
                            REPAIR_SUBMITTED: t("repairSubmitted"),
                            ADMIN_APPROVED: "Admin approved",
                            REPAIR_REJECTED: "Rejected",
                            CITIZEN_DISPUTED: "Citizen disputed",
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
                    <h3 className="text-2xl font-semibold text-white">
                      {currentContractor?.agencyName ?? selectedCity.contractor}
                    </h3>
                  <p className="mt-1 font-mono text-sm text-[#00dbe9]">
                    ID: {currentContractor?.contractorId ?? "CNT-44X-99"}
                  </p>
                  {currentContractor && (
                    <p className="mt-1 text-xs leading-5 text-[#dbc2b0]/75">
                      {currentContractor.ward} | {currentContractor.area} |{" "}
                      {specializationLabels[currentContractor.specialization as keyof typeof specializationLabels] ??
                        currentContractor.specialization}
                    </p>
                  )}
                </div>
              </div>

                <div className="relative mt-6 grid grid-cols-2 gap-3">
                  <Metric icon={<ShieldCheck size={15} />} label={t("status")} value={currentContractor?.availabilityStatus ?? t("nodeSynced")} tone="emerald" />
                  <Metric icon={<Star size={15} />} label="Verified" value={currentContractor?.verificationStatus ?? "4.92 / 5.0"} tone="amber" />
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

                    {selectedReport.rejectionReason && (
                      <div className="mb-5 rounded border border-[#ffb4ab]/30 bg-[#ffb4ab]/10 p-4 text-sm leading-6 text-[#ffdad6]">
                        Ward Admin rejected the last proof: {selectedReport.rejectionReason}
                      </div>
                    )}

                    <div className="mb-5 grid gap-3 sm:grid-cols-3">
                      <WorkStageButton
                        label="Accept Work"
                        active={Boolean(selectedReport.acceptedAt)}
                        onClick={() => updateWorkStatus(selectedReport, "accepted")}
                      />
                      <WorkStageButton
                        label="Work Started"
                        active={Boolean(selectedReport.workStartedAt)}
                        onClick={() => updateWorkStatus(selectedReport, "started")}
                      />
                      <WorkStageButton
                        label="Work Completed"
                        active={Boolean(selectedReport.workCompletedAt)}
                        onClick={() => updateWorkStatus(selectedReport, "completed")}
                      />
                    </div>

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
                        } ${auditProcessing || repairForensicsProcessing ? "scan-active" : ""}`}
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

                    {(repairForensicsProcessing || repairImageForensics) && (
                      <ImageForensicsPanel
                        title="ProofGuard AI repair proof forensics"
                        loading={repairForensicsProcessing}
                        result={repairImageForensics}
                      />
                    )}

                    <label className="mt-5 block">
                      <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#dbc2b0]/70">
                        Repair notes for Ward Admin
                      </span>
                      <textarea
                        value={repairNotes}
                        onChange={(event) => setRepairNotes(event.target.value)}
                        rows={3}
                        className="w-full resize-none rounded border border-white/10 bg-black/35 px-3 py-3 text-sm text-white outline-none transition focus:border-[#00dbe9]/60"
                        placeholder="Example: damaged patch removed, fresh asphalt filled, compaction completed, lane reopened."
                      />
                    </label>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={runRepairAudit}
                        disabled={
                          !repairImage ||
                          repairImageLoading ||
                          repairForensicsProcessing ||
                          auditProcessing ||
                          repairImageForensics?.decision === "REJECT"
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded border border-[#00dbe9] bg-[#00dbe9]/10 px-4 py-3 font-mono text-xs text-[#00dbe9] transition hover:bg-[#00dbe9]/15 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Sparkles
                          size={16}
                          className={auditProcessing || repairImageLoading || repairForensicsProcessing ? "animate-spin" : ""}
                        />
                        {repairImageLoading
                          ? "Preparing image..."
                          : repairForensicsProcessing
                            ? "ProofGuard scanning..."
                            : auditProcessing
                              ? `${t("aiRepairAudit")}...`
                              : audited
                                ? t("ready")
                                : t("runAiRepairAudit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void submitRepairProof()}
                        disabled={
                          repairImageLoading ||
                          repairForensicsProcessing ||
                          auditProcessing ||
                          repairImageForensics?.decision === "REJECT"
                        }
                        className="btn-primary-shimmer relative z-20 flex flex-1 items-center justify-center gap-2 rounded bg-[#00eb88] px-4 py-3 font-mono text-xs font-semibold text-[#00210e] transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ShieldCheck
                          size={16}
                          className={auditProcessing || repairImageLoading || repairForensicsProcessing ? "animate-spin" : ""}
                        />
                        {repairImageLoading
                          ? "Preparing image..."
                          : repairForensicsProcessing
                            ? "ProofGuard scanning..."
                            : auditProcessing
                              ? `${t("aiRepairAudit")}...`
                              : "Submit Proof for Approval"}
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
                          <Audit label={t("asset")} value={displayedRepairAudit?.materialMatch ?? "Pending"} tone="emerald" />
                          <Audit label={t("repairIntegrity")} value={displayedRepairAudit?.repairIntegrity ?? "Pending"} tone="emerald" />
                          <Audit label={t("geoMatch")} value={displayedRepairAudit?.geoVariance ?? "Pending"} tone="cyan" />
                          <Audit label={t("warranty")} value={repairAuditResult?.warrantyDays ? `${repairAuditResult.warrantyDays} Days` : `${selectedReport.warrantyPeriodDays ?? 30} Days`} tone="amber" />
                          <Audit label="AI closure confidence" value={displayedRepairAudit?.closureConfidence ?? "Pending"} tone="emerald" />
                          <Audit label="Visible damage left" value={displayedRepairAudit?.visibleDamageRemaining ?? "Pending"} tone="cyan" />
                        </div>
                      )}

                      {displayedRepairAudit?.recommendation && !auditProcessing && (
                        <p className="mt-4 rounded border border-[#00dbe9]/20 bg-[#00dbe9]/10 p-3 text-sm leading-6 text-[#d3fbff]">
                          {displayedRepairAudit.recommendation}
                        </p>
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
                          {submittedTxUrl && (
                            <a
                              href={submittedTxUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 block truncate font-mono text-xs text-[#7df4ff] underline-offset-4 hover:underline"
                            >
                              Open repair transaction in explorer
                            </a>
                          )}
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

function WorkStageButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-4 py-3 text-left font-mono text-xs font-bold uppercase transition ${
        active
          ? "border-[#00eb88]/35 bg-[#00eb88]/10 text-[#5bffa1]"
          : "border-white/10 bg-black/30 text-[#dbc2b0] hover:border-[#00dbe9]/35 hover:text-[#7df4ff]"
      }`}
    >
      <span className="mb-1 block h-2 w-2 rounded-full bg-current shadow-[0_0_12px_currentColor]" />
      {label}
    </button>
  );
}

function isVisibleToContractor(report: CivicReport, contractor?: ContractorProfile) {
  if (!isAssignedToContractor(report)) {
    return true;
  }

  if (!contractor) {
    return true;
  }

  return (
    report.assignedContractorId === contractor.contractorId ||
    report.assignedContractorDetails?.contractorId === contractor.contractorId ||
    normalizeText(report.contractor) === normalizeText(contractor.name) ||
    normalizeText(report.assignedContractorDetails?.email) === normalizeText(contractor.email)
  );
}

function isAssignedToContractor(report: CivicReport) {
  return !unassignedContractorNames.has((report.contractor ?? "").trim().toLowerCase());
}

function normalizeText(value?: string) {
  return (value ?? "").trim().toLowerCase();
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
    ASSIGNED_TO_CONTRACTOR: "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#7df4ff]",
    WORK_ACCEPTED: "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#7df4ff]",
    WORK_STARTED: "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#7df4ff]",
    WORK_COMPLETED: "border-[#ffc08d]/30 bg-[#ffc08d]/10 text-[#ffc08d]",
    REPAIR_SUBMITTED: "border-[#ffc08d]/30 bg-[#ffc08d]/10 text-[#ffc08d]",
    ADMIN_APPROVED: "border-[#00eb88]/30 bg-[#00eb88]/10 text-[#00eb88]",
    REPAIR_REJECTED: "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]",
    CITIZEN_DISPUTED: "border-[#d946ef]/30 bg-[#d946ef]/10 text-[#f0abfc]",
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
