"use client";

import type { ContractorProfile, CivicReport } from "./mock-data";
import type { RetrievedRule } from "./civic-rag-rules";

export type AiAgentAudit = {
  mode: "real-ai" | "ruleset-fallback";
  provider: string;
  fallbackReason?: string;
  agentName: string;
  providerLabel: string;
  retrievedRules: Array<Pick<RetrievedRule, "id" | "title" | "category" | "ruleText" | "slaHours" | "warrantyDays" | "matchScore" | "source" | "version" | "effectiveFrom">>;
};

export type AiRepairAuditResult = {
  materialMatch: string;
  repairIntegrity: string;
  geoVariance: string;
  beforeAfterDelta: string;
  closureConfidence: string;
  visibleDamageRemaining: string;
  qualityScore: number;
  warrantyDays: number;
  status: "PASS" | "NEEDS_REVIEW" | "FAIL";
  recommendation: string;
  aiAudit?: AiAgentAudit;
};

export type AiContractorMatchResult = {
  recommendedContractorId: string;
  contractorName: string;
  matchScore: number;
  reason: string;
  riskNote: string;
  aiAudit?: AiAgentAudit;
};

export type AiPublicSummaryResult = {
  headline: string;
  citizenSummary: string;
  currentStatus: string;
  nextAction: string;
  transparencyNote: string;
  aiAudit?: AiAgentAudit;
};

export type AiWarrantyRiskResult = {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  repeatProbability: number;
  warrantyBreachLikely: boolean;
  matchedReportIds: string[];
  reason: string;
  recommendedAction: string;
  aiAudit?: AiAgentAudit;
};

export type AiDuplicateCheckResult = {
  duplicateLikely: boolean;
  similarityScore: number;
  matchedReportIds: string[];
  reason: string;
  recommendedAction: string;
  humanReviewRequired: boolean;
  aiAudit?: AiAgentAudit;
};

export type AiEscalationRiskResult = {
  escalationLevel: "NONE" | "WARD_REVIEW" | "URGENT" | "EMERGENCY";
  publicSafetyRisk: boolean;
  escalationReasons: string[];
  notifyRoles: string[];
  recommendedAction: string;
  humanReviewRequired: boolean;
  aiAudit?: AiAgentAudit;
};

type AgentResponse<T> = {
  mode?: "real-ai" | "ruleset-fallback";
  provider?: string;
  fallbackReason?: string;
  retrievedRules?: AiAgentAudit["retrievedRules"];
  agentTrace?: {
    agentName?: string;
    retrievedRuleIds?: string[];
    providerLabel?: string;
  };
  result?: T;
};

export async function requestRepairAudit(input: {
  report: CivicReport;
  repairImageName: string;
  repairImageDataUrl: string;
  repairNotes?: string;
  contractorName?: string;
}) {
  const fallback = buildRepairAuditFallback(input.report, Boolean(input.repairImageDataUrl));

  try {
    const response = await fetch("/api/ai/repair-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as AgentResponse<AiRepairAuditResult>;
    return withAudit<AiRepairAuditResult>(payload.result ?? fallback, payload, fallback);
  } catch (error) {
    console.warn("CityPramaan repair audit AI unavailable:", error);
    return fallback;
  }
}

export async function requestContractorMatch(input: {
  report: CivicReport;
  contractors: ContractorProfile[];
}) {
  const fallback: AiContractorMatchResult = {
    recommendedContractorId: input.contractors[0]?.contractorId ?? "",
    contractorName: input.contractors[0]?.name ?? "No contractor available",
    matchScore: input.contractors[0] ? 65 : 0,
    reason: "Fallback contractor ranking used because AI matching is unavailable.",
    riskNote: "Ward admin should verify specialization and availability manually.",
  };

  try {
    const response = await fetch("/api/ai/contractor-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as AgentResponse<AiContractorMatchResult>;
    return withAudit<AiContractorMatchResult>(payload.result ?? fallback, payload, fallback);
  } catch (error) {
    console.warn("CityPramaan contractor matching AI unavailable:", error);
    return fallback;
  }
}

export async function requestPublicSummary(input: { report: CivicReport; language?: string }) {
  const fallback: AiPublicSummaryResult = {
    headline: input.report.title,
    citizenSummary:
      input.report.aiSummary ??
      "This public proof record shows the issue, repair progress, contractor proof, and warranty state.",
    currentStatus: input.report.status,
    nextAction: input.report.recommendedAction ?? "Await the next verified civic workflow update.",
    transparencyNote: "Reporter private identity stays protected while public proof remains visible.",
  };

  try {
    const response = await fetch("/api/ai/public-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as AgentResponse<AiPublicSummaryResult>;
    return withAudit<AiPublicSummaryResult>(payload.result ?? fallback, payload, fallback);
  } catch (error) {
    console.warn("CityPramaan public summary AI unavailable:", error);
    return fallback;
  }
}

export async function requestWarrantyRisk(input: {
  report: CivicReport;
  cityReports: CivicReport[];
}) {
  const fallback = buildWarrantyRiskFallback(input.report, input.cityReports);

  try {
    const response = await fetch("/api/ai/warranty-risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as AgentResponse<AiWarrantyRiskResult>;
    return withAudit<AiWarrantyRiskResult>(payload.result ?? fallback, payload, fallback);
  } catch (error) {
    console.warn("CityPramaan warranty risk AI unavailable:", error);
    return fallback;
  }
}

export async function requestDuplicateCheck(input: {
  report: CivicReport;
  cityReports: CivicReport[];
}) {
  const fallback = buildDuplicateCheckFallback(input.report, input.cityReports);

  try {
    const response = await fetch("/api/ai/duplicate-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as AgentResponse<AiDuplicateCheckResult>;
    return withAudit<AiDuplicateCheckResult>(payload.result ?? fallback, payload, fallback);
  } catch (error) {
    console.warn("CityPramaan duplicate check AI unavailable:", error);
    return fallback;
  }
}

export async function requestEscalationRisk(input: { report: CivicReport }) {
  const fallback = buildEscalationRiskFallback(input.report);

  try {
    const response = await fetch("/api/ai/escalation-risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as AgentResponse<AiEscalationRiskResult>;
    return withAudit<AiEscalationRiskResult>(payload.result ?? fallback, payload, fallback);
  } catch (error) {
    console.warn("CityPramaan escalation risk AI unavailable:", error);
    return fallback;
  }
}

function buildRepairAuditFallback(report: CivicReport, hasImage: boolean): AiRepairAuditResult {
  const isPower = report.issueCategory === "POWER_OUTAGE";

  return {
    materialMatch: isPower ? "Restoration signal requires issuer review" : "Visual repair proof attached",
    repairIntegrity: hasImage ? "Needs issuer review" : "Proof missing",
    geoVariance: "Location consistency pending",
    beforeAfterDelta: hasImage ? "After-repair evidence submitted" : "No after-repair proof available",
    closureConfidence: hasImage ? "74%" : "42%",
    visibleDamageRemaining: "Unknown until AI vision is available",
    qualityScore: hasImage ? 74 : 42,
    warrantyDays: isPower ? 7 : 30,
    status: hasImage ? "NEEDS_REVIEW" : "FAIL",
    recommendation: "AI provider is unavailable, so ward admin should manually verify repair evidence.",
  };
}

function buildWarrantyRiskFallback(report: CivicReport, reports: CivicReport[]): AiWarrantyRiskResult {
  const category = normalize(report.issueCategory);
  const location = normalize(report.location).slice(0, 24);
  const matches = reports.filter(
    (item) =>
      item.id !== report.id &&
      normalize(item.issueCategory) === category &&
      normalize(item.location).slice(0, 24) === location
  );
  const repeatProbability = Math.min(
    95,
    matches.length * 28 + (report.warrantyStatus === "ACTIVE" ? 22 : 0)
  );

  return {
    riskLevel: repeatProbability > 85 ? "CRITICAL" : repeatProbability > 70 ? "HIGH" : repeatProbability > 35 ? "MEDIUM" : "LOW",
    repeatProbability,
    warrantyBreachLikely: repeatProbability > 65,
    matchedReportIds: matches.map((item) => item.id).slice(0, 5),
    reason: matches.length
      ? "Similar issue records were found near the same location/category."
      : "No strong repeat pattern found in available city reports.",
    recommendedAction:
      repeatProbability > 65
        ? "Flag for warranty review and require stronger contractor proof."
        : "Continue normal monitoring after repair approval.",
  };
}

function buildDuplicateCheckFallback(report: CivicReport, reports: CivicReport[]): AiDuplicateCheckResult {
  const category = normalize(report.issueCategory);
  const location = normalize(report.location).slice(0, 28);
  const matches = reports.filter(
    (item) =>
      item.id !== report.id &&
      normalize(item.issueCategory) === category &&
      (normalize(item.location).slice(0, 28) === location || normalize(item.ward) === normalize(report.ward))
  );
  const similarityScore = Math.min(96, matches.length * 26);

  return {
    duplicateLikely: similarityScore >= 55,
    similarityScore,
    matchedReportIds: matches.map((item) => item.id).slice(0, 6),
    reason: matches.length
      ? "Similar category and nearby ward/location reports exist in local city history."
      : "No strong duplicate pattern found in available city history.",
    recommendedAction:
      similarityScore >= 55
        ? "Review matched proof records before creating a separate work order."
        : "Treat as separate report and keep monitoring for repeats.",
    humanReviewRequired: similarityScore >= 55,
  };
}

function buildEscalationRiskFallback(report: CivicReport): AiEscalationRiskResult {
  const text = normalize(`${report.title} ${report.location} ${report.aiSummary} ${report.recommendedAction}`);
  const hasEmergencySignal = ["collapse", "sinkhole", "open manhole", "exposed wire", "bridge"].some((term) =>
    text.includes(term)
  );
  const hasUrgentSignal = ["sewage", "transformer", "blackout", "school", "market", "waterlogging"].some((term) =>
    text.includes(term)
  );
  const isCritical = normalize(report.severity) === "critical";
  const escalationLevel = hasEmergencySignal
    ? "EMERGENCY"
    : hasUrgentSignal || isCritical
      ? "URGENT"
      : report.confidence < 65
        ? "WARD_REVIEW"
        : "NONE";

  return {
    escalationLevel,
    publicSafetyRisk: escalationLevel === "URGENT" || escalationLevel === "EMERGENCY",
    escalationReasons: [
      isCritical ? "Critical severity report." : "",
      hasEmergencySignal ? "Emergency safety signal detected." : "",
      hasUrgentSignal ? "Public health, utility, or crowd-area urgency signal detected." : "",
      report.confidence < 65 ? "AI confidence below human-review threshold." : "",
    ].filter(Boolean),
    notifyRoles:
      escalationLevel === "EMERGENCY"
        ? ["Ward Admin", "Emergency Field Supervisor", "Contractor Lead"]
        : escalationLevel === "URGENT"
          ? ["Ward Admin", "Contractor Lead"]
          : escalationLevel === "WARD_REVIEW"
            ? ["Ward Admin"]
            : [],
    recommendedAction:
      escalationLevel === "NONE"
        ? "Continue normal civic workflow."
        : "Move to escalation queue and require admin review before closure.",
    humanReviewRequired: escalationLevel !== "NONE",
  };
}

function normalize(value?: string) {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function withAudit<T extends { aiAudit?: AiAgentAudit }>(
  result: T,
  payload: AgentResponse<T>,
  fallback: T
) {
  if (!payload.mode && !payload.provider && !payload.retrievedRules && !payload.agentTrace) {
    return result;
  }

  return {
    ...result,
    aiAudit: {
      mode: payload.mode ?? "ruleset-fallback",
      provider: payload.provider ?? "local",
      fallbackReason: payload.fallbackReason,
      agentName: payload.agentTrace?.agentName ?? "CityPramaan AI Agent",
      providerLabel: payload.agentTrace?.providerLabel ?? payload.provider ?? "Local ruleset",
      retrievedRules: payload.retrievedRules ?? fallback.aiAudit?.retrievedRules ?? [],
    },
  };
}
