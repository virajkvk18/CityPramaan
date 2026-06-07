/* eslint-disable @next/next/no-img-element */
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  ExternalLink,
  Fingerprint,
  LayoutDashboard,
  MapPin,
  Phone,
  ScanSearch,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { LanguageSelector } from "@/src/components/layout/LanguageSelector";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { DEFAULT_CITY_KEY, demoCities, getCityByKey, type CityKey } from "@/src/lib/city-context";
import { getCitySnapshot, setSelectedCityKey, subscribeCity } from "@/src/lib/city-storage";
import { getReportsForCity, type CivicReport, type ContractorProfile } from "@/src/lib/mock-data";
import {
  appendReportEvent,
  getLocalReportsSnapshot,
  subscribeLocalReports,
} from "@/src/lib/report-storage";
import { mergeReportsById, saveReportEverywhere, watchBackendReports } from "@/src/lib/report-sync";
import {
  attachReportToContractor,
  fetchBackendContractors,
  findSuggestedContractors,
  getContractorsSnapshot,
  mergeContractorLists,
  specializationLabels,
  subscribeContractors,
} from "@/src/lib/contractor-storage";
import { requestContractorMatch, type AiContractorMatchResult } from "@/src/lib/ai-agents-client";
import { useLanguage } from "@/src/lib/use-language";
import { useDetectedLocationDisplay } from "@/src/lib/use-detected-location";

const reviewStatuses: CivicReport["status"][] = [
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
  const contractorsSnapshot = useSyncExternalStore(
    subscribeContractors,
    getContractorsSnapshot,
    () => "[]"
  );
  const selectedCity = getCityByKey(citySnapshot);
  const cityDisplay = useDetectedLocationDisplay(selectedCity);
  const [backendReports, setBackendReports] = useState<CivicReport[]>([]);
  const [backendContractors, setBackendContractors] = useState<ContractorProfile[]>([]);
  const localReports = useMemo(
    () => JSON.parse(localReportsSnapshot) as CivicReport[],
    [localReportsSnapshot]
  );
  useEffect(() => {
    return watchBackendReports(selectedCity.key, setBackendReports);
  }, [selectedCity.key]);
  useEffect(() => {
    let active = true;

    fetchBackendContractors().then((items) => {
      if (active) {
        setBackendContractors(items);
      }
    });

    return () => {
      active = false;
    };
  }, []);
  const contractors = useMemo(
    () => mergeContractorLists(JSON.parse(contractorsSnapshot) as ContractorProfile[], backendContractors),
    [backendContractors, contractorsSnapshot]
  );
  const allReports = useMemo(() => {
    return mergeReportsById(
      getReportsForCity(selectedCity.key),
      backendReports,
      localReports
    ).filter((report) => !report.cityKey || report.cityKey === selectedCity.key);
  }, [backendReports, localReports, selectedCity.key]);
  const reviewReports = useMemo(
    () =>
      allReports
        .filter((report) => reviewStatuses.includes(report.status))
        .sort(sortReviewReports),
    [allReports]
  );
  const pendingCount = reviewReports.filter((report) => report.status === "REPAIR_SUBMITTED").length;
  const aiCriticalCount = reviewReports.filter(
    (report) =>
      report.severity === "Critical" ||
      (report.aiPriorityScore ?? 0) >= 90 ||
      report.status === "REPEAT_FAILURE"
  ).length;
  const lowConfidenceCount = reviewReports.filter((report) => report.confidence < 70).length;
  const warrantyWatchCount = reviewReports.filter(
    (report) =>
      report.warrantyStatus === "ACTIVE" ||
      report.status === "UNDER_WARRANTY" ||
      report.status === "REPEAT_FAILURE"
  ).length;
  const [selectedReportId, setSelectedReportId] = useState(
    reviewReports.find((report) => report.status === "REPAIR_SUBMITTED")?.id ?? reviewReports[0]?.id ?? ""
  );
  const [actionMessage, setActionMessage] = useState("");
  const selectedReport =
    reviewReports.find((report) => report.id === selectedReportId) ??
    reviewReports.find((report) => report.status === "REPAIR_SUBMITTED") ??
    reviewReports[0];
  const hasRepairProof = Boolean(selectedReport?.repairImageDataUrl || selectedReport?.repairImageName);
  const suggestedContractors = useMemo(
    () => (selectedReport ? findSuggestedContractors(selectedReport, contractors) : contractors),
    [contractors, selectedReport]
  );
  const [selectedContractorId, setSelectedContractorId] = useState("");
  const [adminOverrideReason, setAdminOverrideReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [aiContractorMatch, setAiContractorMatch] = useState<AiContractorMatchResult | null>(null);
  const activeContractor =
    suggestedContractors.find((contractor) => contractor?.contractorId === selectedContractorId) ??
    suggestedContractors[0];

  useEffect(() => {
    if (!selectedReport || !suggestedContractors.length) {
      return;
    }

    let active = true;

    requestContractorMatch({
      report: selectedReport,
      contractors: suggestedContractors,
    })
      .then((match) => {
        if (!active) {
          return;
        }

        setAiContractorMatch(match);

        if (match.recommendedContractorId) {
          setSelectedContractorId(match.recommendedContractorId);
        }
      })

    return () => {
      active = false;
    };
  }, [selectedReport, suggestedContractors]);

  function assignContractor(report: CivicReport, contractor = activeContractor) {
    if (["ADMIN_APPROVED", "UNDER_WARRANTY", "CLOSED"].includes(report.status)) {
      setActionMessage("This report is already verified. Assignment is locked.");
      return;
    }

    if (!contractor) {
      setActionMessage("No contractor profile is available for this assignment.");
      return;
    }

    const aiRecommendedId = aiContractorMatch?.recommendedContractorId;
    const overrideRequired = Boolean(aiRecommendedId && contractor.contractorId !== aiRecommendedId);
    const overrideReason = adminOverrideReason.trim();

    if (overrideRequired && !overrideReason) {
      setActionMessage("Add an admin override reason before assigning a contractor different from the AI recommendation.");
      return;
    }

    const now = new Date();
    const updated = appendReportEvent(
      {
        ...report,
        cityKey: report.cityKey ?? selectedCity.key,
        contractor: contractor.name,
        assignedContractorId: contractor.contractorId,
        assignedContractorDetails: contractor,
        assignedByAdmin: "Ward Admin",
        status: "ASSIGNED_TO_CONTRACTOR",
        assignedAt: now.toISOString(),
        rejectionReason: undefined,
      },
      {
        label: "Ward Admin assigned contractor",
        detail: `Ward Admin assigned this issue to ${contractor.name}, Contractor ID: ${contractor.contractorId}, ${contractor.ward} ${specializationLabels[contractor.specialization as keyof typeof specializationLabels] ?? contractor.specialization} team.${
          overrideReason ? ` Override reason: ${overrideReason}` : ""
        }`,
        time: now.toLocaleString(),
        tx: `0xassign...${report.id.replace("CP-", "")}`,
      }
    );

    void saveReportEverywhere(updated);
    attachReportToContractor(contractor.contractorId, report.id);
    setAdminOverrideReason("");
    setActionMessage(`${report.id} assigned to ${contractor.name}. It will now appear in Contractor dashboard.`);
  }

  async function approveRepairAndActivateWarranty(report: CivicReport) {
    if (report.status !== "REPAIR_SUBMITTED") {
      setActionMessage("Only contractor proofs with Repair Submitted status can be approved.");
      return;
    }

    if (!report.repairImageDataUrl && !report.repairImageName) {
      setActionMessage("Contractor repair proof is required before warranty activation.");
      return;
    }

    const tx = report.proofBundleHash ?? report.repairEvidenceHash ?? report.evidenceHash ?? report.txHash;

    const now = new Date();
    const isPowerOutage = report.issueCategory === "POWER_OUTAGE";
    const warrantyDays = 90;
    const warrantyExpiresAt = new Date(now.getTime() + warrantyDays * 24 * 60 * 60 * 1000);
    const updated = appendReportEvent(
      {
        ...report,
        cityKey: report.cityKey ?? selectedCity.key,
        status: "ADMIN_APPROVED",
        adminApprovalStatus: "APPROVED",
        citizenFinalApproval: "PENDING",
        warrantyDaysLeft: null,
        warrantyPeriodDays: warrantyDays,
        warrantyExpiresAt: warrantyExpiresAt.toISOString(),
        rejectionReason: undefined,
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
          ? "Ward Admin approved utility proof. Citizen confirmation is required before closure and warranty activation."
          : "Ward Admin approved contractor repair proof. Citizen confirmation is required before closure and warranty activation.",
        time: now.toLocaleString(),
        tx,
      }
    );

    void saveReportEverywhere(updated);
    setActionMessage(`${report.id} approved by Ward Admin. Fabric anchoring is ready for teammate integration.`);
  }

  function rejectRepairProof(report: CivicReport) {
    if (report.status !== "REPAIR_SUBMITTED") {
      setActionMessage("Only submitted contractor proof can be rejected.");
      return;
    }

    const reason = rejectionReason.trim() || "Repair proof is not sufficient. Please upload clearer after-repair evidence.";
    const now = new Date();
    const updated = appendReportEvent(
      {
        ...report,
        status: "REPAIR_REJECTED",
        adminApprovalStatus: "REJECTED",
        rejectionReason: reason,
        repairAudit: {
          ...report.repairAudit,
          materialMatch: report.repairAudit?.materialMatch ?? "Needs recheck",
          repairIntegrity: "Rejected",
          geoVariance: report.repairAudit?.geoVariance ?? "Needs recheck",
          recommendation: reason,
        },
      },
      {
        label: "Ward Admin rejected repair proof",
        detail: reason,
        time: now.toLocaleString(),
        tx: `0xreject...${report.id.replace("CP-", "")}`,
      }
    );

    void saveReportEverywhere(updated);
    setRejectionReason("");
    setActionMessage(`${report.id} sent back to contractor with rejection reason.`);
  }

  function closeVerifiedIssue(report: CivicReport) {
    if (report.status !== "CLOSED") {
      setActionMessage("Citizen final confirmation is required before Ward Admin can consider this issue closed.");
      return;
    }
    setActionMessage(`${report.id} is already closed by citizen confirmation and visible in Public Proof.`);
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
          <BrandLogo size="sm" subtitle="Ward Admin" />
        </div>
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <button className="hidden h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0]/70 transition hover:text-[#00eb88] sm:grid">
            <Settings size={16} />
          </button>
          <ThemeToggle />
          <LanguageSelector compact />
        </div>
      </header>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[#ff9933]/15 bg-[linear-gradient(180deg,rgba(255,153,51,0.08),rgba(0,0,0,0.5)_22%,rgba(0,219,233,0.045))] px-4 pb-5 pt-20 shadow-[5px_0_24px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:flex">
        <div className="mt-2 border-b border-white/10 px-2 pb-5">
          <BrandLogo size="sm" subtitle="Ward Admin" />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label={t("commandCenter")} />
          <NavItem href="/ward-admin" icon={<ScanSearch size={18} />} label="Ward Admin Queue" active />
          <NavItem href="/warranty" icon={<CalendarClock size={18} />} label={t("warrantyScanner")} />
          <NavItem href="/reports" icon={<BadgeCheck size={18} />} label={t("publicProof")} />
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
              <h1 className="mt-2 text-3xl font-semibold text-white sm:text-5xl">Ward Admin Queue</h1>
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

          <section className="mb-6 grid gap-3 md:grid-cols-3">
            <AiMetric
              label="Critical escalation queue"
              value={String(aiCriticalCount).padStart(2, "0")}
              detail="Critical severity, repeat failures, or 90+ AI priority"
              tone="rose"
            />
            <AiMetric
              label="Low confidence review"
              value={String(lowConfidenceCount).padStart(2, "0")}
              detail="Reports below the 70% human-review threshold"
              tone="cyan"
            />
            <AiMetric
              label="Warranty watchlist"
              value={String(warrantyWatchCount).padStart(2, "0")}
              detail="Active warranty or repeat-location monitoring"
              tone="emerald"
            />
          </section>

          <section className="mb-6 rounded-lg border border-[#00dbe9]/20 bg-[#00dbe9]/10 p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#7df4ff]">
              AI/RAG review layer
            </p>
            <p className="mt-1 text-sm leading-6 text-[#d3fbff]">
              The previous EVM proof flow has been removed. Ward Admin actions now produce Fabric-ready hashes and timeline events for teammate Fabric integration.
            </p>
          </section>

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
                        <Info
                          label="Fabric status"
                          value={selectedReport.proofBundleHash ? "Proof bundle ready" : "Pending proof bundle"}
                        />
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

                    {selectedReport.rejectionReason && (
                      <div className="mt-4 rounded border border-[#ffb4ab]/30 bg-[#ffb4ab]/10 p-4 text-sm leading-6 text-[#ffdad6]">
                        Previous rejection reason: {selectedReport.rejectionReason}
                      </div>
                    )}

                    <div className="mt-5 rounded border border-[#ffc08d]/20 bg-black/25 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#ffc08d]">
                            Suggested contractors for this area/category
                          </p>
                          <p className="mt-1 text-xs text-[#dbc2b0]/65">
                            {aiContractorMatch
                                ? `AI recommends ${aiContractorMatch.contractorName} with ${aiContractorMatch.matchScore}/100 match score.`
                                : `Matched against ${selectedReport.ward}, ${selectedReport.issueCategory ?? "GENERAL"}, and issue location.`}
                          </p>
                        </div>
                        <span className="rounded border border-[#00dbe9]/25 bg-[#00dbe9]/10 px-2 py-1 font-mono text-[10px] text-[#7df4ff]">
                          {suggestedContractors.length} matches
                        </span>
                      </div>
                      <div className="grid gap-3 lg:grid-cols-2">
                        {suggestedContractors.map((contractor) => (
                          <button
                            key={contractor.contractorId}
                            type="button"
                            onClick={() => setSelectedContractorId(contractor.contractorId)}
                            className={`rounded-lg border p-4 text-left transition ${
                              activeContractor?.contractorId === contractor.contractorId
                                ? "border-[#ffc08d]/60 bg-[#ffc08d]/10"
                                : "border-white/10 bg-black/25 hover:border-[#00dbe9]/35"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-white">{contractor.name}</p>
                                <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-[#7df4ff]">
                                  <Fingerprint size={12} />
                                  {contractor.contractorId} | {contractor.identityNumber}
                                </p>
                              </div>
                              <span className={`rounded border px-2 py-1 font-mono text-[9px] uppercase ${
                                contractor.availabilityStatus === "Available"
                                  ? "border-[#00eb88]/30 bg-[#00eb88]/10 text-[#5bffa1]"
                                  : "border-[#ffc08d]/30 bg-[#ffc08d]/10 text-[#ffdcc2]"
                              }`}>
                                {contractor.availabilityStatus}
                              </span>
                            </div>
                            <div className="mt-3 grid gap-2 text-xs text-[#dbc2b0]/75">
                              <span>{contractor.agencyName}</span>
                              <span>{contractor.ward} | {contractor.area}</span>
                              <span>{specializationLabels[contractor.specialization as keyof typeof specializationLabels] ?? contractor.specialization}</span>
                              <span className="flex items-center gap-1"><Phone size={12} /> {contractor.phone}</span>
                              <span>{contractor.email}</span>
                              <span className="text-[#00eb88]">{contractor.verificationStatus}</span>
                            </div>
                            <span className="mt-3 inline-flex rounded border border-[#ffc08d]/35 bg-[#ffc08d]/10 px-3 py-2 font-mono text-[10px] font-bold uppercase text-[#ffdcc2]">
                              Select contractor
                            </span>
                          </button>
                        ))}
                      </div>
                      {aiContractorMatch && (
                        <div className="mt-4 rounded border border-[#00dbe9]/25 bg-[#00dbe9]/10 p-3 text-xs leading-5 text-[#d3fbff]">
                          <p className="font-semibold text-[#7df4ff]">AI Contractor Matching Agent</p>
                          <p className="mt-1">{aiContractorMatch.reason}</p>
                          <p className="mt-1 text-[#ffc08d]">{aiContractorMatch.riskNote}</p>
                        </div>
                      )}
                      {aiContractorMatch?.recommendedContractorId &&
                        activeContractor?.contractorId !== aiContractorMatch.recommendedContractorId && (
                          <label className="mt-4 block rounded border border-[#ffc08d]/25 bg-[#ffc08d]/10 p-3">
                            <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#ffdcc2]">
                              Admin override reason
                            </span>
                            <textarea
                              value={adminOverrideReason}
                              onChange={(event) => setAdminOverrideReason(event.target.value)}
                              rows={3}
                              className="w-full resize-none rounded border border-white/10 bg-black/45 px-3 py-3 text-sm text-white outline-none focus:border-[#ffc08d]/60"
                              placeholder="Explain why this contractor is being selected instead of the AI recommendation."
                            />
                          </label>
                        )}
                      <button
                        type="button"
                        onClick={() => assignContractor(selectedReport)}
                        disabled={["ADMIN_APPROVED", "UNDER_WARRANTY", "CLOSED"].includes(selectedReport.status) || !activeContractor}
                        className="mt-4 w-full rounded border border-[#ffc08d]/45 bg-[#ffc08d]/10 px-4 py-3 font-mono text-xs font-bold uppercase text-[#ffdcc2] transition hover:bg-[#ffc08d]/15 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Assign Selected Contractor
                      </button>
                      <div className="mt-3 rounded border border-white/10 bg-black/30 p-3 text-xs leading-5 text-[#dbc2b0]/75">
                        Citizen: {selectedReport.citizenName ?? "Citizen reporter"} {selectedReport.citizenContact ? `| ${selectedReport.citizenContact}` : ""}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => void approveRepairAndActivateWarranty(selectedReport)}
                        disabled={selectedReport.status !== "REPAIR_SUBMITTED" || !hasRepairProof}
                        className="btn-primary-shimmer flex flex-1 items-center justify-center gap-2 rounded bg-[#ffc08d] px-4 py-3 font-mono text-xs font-semibold text-[#4c2700] transition disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <ShieldCheck size={16} />
                        Admin Approve Repair Proof
                      </button>
                      <Link
                        href={`/proof/${selectedReport.id}`}
                        className="flex flex-1 items-center justify-center gap-2 rounded border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-4 py-3 text-sm font-semibold text-[#7df4ff] transition hover:bg-[#00dbe9]/15"
                      >
                        Open Public Proof
                        <ExternalLink size={15} />
                      </Link>
                    </div>

                    {selectedReport.status === "REPAIR_SUBMITTED" && (
                      <div className="mt-4 rounded border border-[#ffb4ab]/25 bg-[#ffb4ab]/10 p-4">
                        <label>
                          <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#ffdad6]">
                            Reject with reason
                          </span>
                          <textarea
                            value={rejectionReason}
                            onChange={(event) => setRejectionReason(event.target.value)}
                            rows={3}
                            className="w-full resize-none rounded border border-white/10 bg-black/45 px-3 py-3 text-sm text-white outline-none focus:border-[#ffb4ab]/60"
                            placeholder="Example: After photo is unclear, location mismatch, or repair still visibly incomplete."
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => rejectRepairProof(selectedReport)}
                          className="mt-3 rounded border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 px-4 py-3 font-mono text-xs font-bold uppercase text-[#ffdad6] transition hover:bg-[#ffb4ab]/15"
                        >
                          Reject Proof
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => closeVerifiedIssue(selectedReport)}
                      disabled={selectedReport.status !== "CLOSED"}
                      className="mt-4 w-full rounded border border-[#00eb88]/35 bg-[#00eb88]/10 px-4 py-3 font-mono text-xs font-bold uppercase text-[#5bffa1] transition hover:bg-[#00eb88]/15 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Closure controlled by citizen confirmation
                    </button>

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

function AiMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "rose" | "cyan" | "emerald";
}) {
  const colors = {
    rose: "border-[#ffb4ab]/25 bg-[#ffb4ab]/10 text-[#ffdad6]",
    cyan: "border-[#00dbe9]/25 bg-[#00dbe9]/10 text-[#d3fbff]",
    emerald: "border-[#00eb88]/25 bg-[#00eb88]/10 text-[#d3ffe7]",
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[tone]}`}>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-3 font-mono text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 opacity-80">{detail}</p>
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
    <span className={`shrink-0 rounded border px-2 py-1 font-mono text-[10px] uppercase ${tones[report.status]}`}>
      {statusCopy(report)}
    </span>
  );
}

function statusCopy(report: CivicReport) {
  const labels = {
    OPEN: "Open",
    PENDING_PROOF: "Awaiting contractor",
    ASSIGNED_TO_CONTRACTOR: "Assigned",
    WORK_ACCEPTED: "Work accepted",
    WORK_STARTED: "Work started",
    WORK_COMPLETED: "Work completed",
    REPAIR_SUBMITTED: "Pending approval",
    ADMIN_APPROVED: "Admin approved",
    REPAIR_REJECTED: "Proof rejected",
    CITIZEN_DISPUTED: "Citizen disputed",
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

    if (report.status === "CITIZEN_DISPUTED") {
      return 1;
    }

    if (report.status === "REPAIR_SUBMITTED") {
      return 2;
    }

    if (["PENDING_PROOF", "OPEN", "ASSIGNED_TO_CONTRACTOR", "WORK_ACCEPTED", "WORK_STARTED", "WORK_COMPLETED", "REPAIR_REJECTED"].includes(report.status)) {
      return 3;
    }

    if (report.status === "UNDER_WARRANTY" || report.status === "REPEAT_FAILURE") {
      return 4;
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
