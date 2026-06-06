"use client";

import type { ContractorProfile, CivicReport } from "./mock-data";

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
};

export type AiContractorMatchResult = {
  recommendedContractorId: string;
  contractorName: string;
  matchScore: number;
  reason: string;
  riskNote: string;
};

type AgentResponse<T> = {
  mode?: "real-ai" | "ruleset-fallback";
  provider?: string;
  fallbackReason?: string;
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
    return payload.result ?? fallback;
  } catch (error) {
    console.warn("CityPramaan repair audit AI unavailable:", error);
    return fallback;
  }
}

export async function requestContractorMatch(input: {
  report: CivicReport;
  contractors: ContractorProfile[];
}) {
  const fallback = {
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
    return payload.result ?? fallback;
  } catch (error) {
    console.warn("CityPramaan contractor matching AI unavailable:", error);
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
