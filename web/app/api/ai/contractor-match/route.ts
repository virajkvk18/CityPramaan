import { NextResponse } from "next/server";
import { asString, clampNumber, runJsonAgent } from "@/src/lib/ai-agent-server";
import type { ContractorProfile, CivicReport } from "@/src/lib/mock-data";

type ContractorMatchBody = {
  report?: CivicReport;
  contractors?: ContractorProfile[];
};

type ContractorMatchResult = {
  recommendedContractorId: string;
  contractorName: string;
  matchScore: number;
  reason: string;
  riskNote: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ContractorMatchBody;
  const report = body.report;
  const contractors = body.contractors ?? [];
  const fallback = buildFallback(report, contractors);

  const agent = await runJsonAgent<ContractorMatchResult>({
    agentName: "Contractor Matching Agent",
    task:
      "Choose the best contractor for this civic issue using specialization, ward/area fit, availability, verification, and workload.",
    input: {
      report: report
        ? {
            id: report.id,
            title: report.title,
            ward: report.ward,
            location: report.location,
            issueCategory: report.issueCategory,
            severity: report.severity,
            aiPriorityScore: report.aiPriorityScore,
          }
        : null,
      contractors: contractors.map((contractor) => ({
        contractorId: contractor.contractorId,
        name: contractor.name,
        area: contractor.area,
        ward: contractor.ward,
        specialization: contractor.specialization,
        verificationStatus: contractor.verificationStatus,
        availabilityStatus: contractor.availabilityStatus,
        assignedReports: contractor.assignedReports ?? [],
      })),
    },
    fallback,
    schema:
      '{ "recommendedContractorId": string, "contractorName": string, "matchScore": number 0-100, "reason": string, "riskNote": string }',
    ruleQuery: {
      text: `${report?.title ?? ""} ${report?.location ?? ""} ${report?.ward ?? ""} contractor assignment`,
      category: report?.issueCategory,
      report,
      limit: 5,
    },
  });

  return NextResponse.json({
    ...agent,
    result: sanitize(agent.result, fallback, contractors),
  });
}

function buildFallback(report?: CivicReport, contractors: ContractorProfile[] = []): ContractorMatchResult {
  const normalizedCategory = normalize(report?.issueCategory);
  const scored = contractors
    .map((contractor) => {
      const specialization = normalize(contractor.specialization);
      const wardMatch = normalize(report?.ward).includes(normalize(contractor.ward)) || normalize(contractor.ward).includes(normalize(report?.ward));
      const locationMatch = normalize(report?.location).includes(normalize(contractor.area));
      return {
        contractor,
        score:
          (specialization.includes(normalizedCategory) || normalizedCategory.includes(specialization) ? 42 : 0) +
          (wardMatch ? 24 : 0) +
          (locationMatch ? 18 : 0) +
          (contractor.verificationStatus === "Verified" ? 8 : 0) +
          (contractor.availabilityStatus === "Available" ? 8 : contractor.availabilityStatus === "Busy" ? 2 : 0) -
          (contractor.assignedReports?.length ?? 0) * 2,
      };
    })
    .sort((first, second) => second.score - first.score);
  const best = scored[0]?.contractor ?? contractors[0];

  return {
    recommendedContractorId: best?.contractorId ?? "",
    contractorName: best?.name ?? "No contractor available",
    matchScore: Math.max(0, Math.min(100, scored[0]?.score ?? 0)),
    reason: best
      ? `${best.name} is the strongest local match based on specialization, ward/area fit, and availability.`
      : "No contractor profile was provided.",
    riskNote: best?.availabilityStatus === "Busy" ? "Recommended contractor is busy; admin may still assign if specialization fit is critical." : "No major assignment risk detected.",
  };
}

function sanitize(
  raw: ContractorMatchResult,
  fallback: ContractorMatchResult,
  contractors: ContractorProfile[]
): ContractorMatchResult {
  const validIds = new Set(contractors.map((contractor) => contractor.contractorId));
  const recommendedContractorId = validIds.has(raw.recommendedContractorId)
    ? raw.recommendedContractorId
    : fallback.recommendedContractorId;
  const contractorName =
    contractors.find((contractor) => contractor.contractorId === recommendedContractorId)?.name ??
    fallback.contractorName;

  return {
    recommendedContractorId,
    contractorName,
    matchScore: clampNumber(raw.matchScore, fallback.matchScore),
    reason: asString(raw.reason, fallback.reason),
    riskNote: asString(raw.riskNote, fallback.riskNote),
  };
}

function normalize(value?: string) {
  const normalized = (value ?? "").toUpperCase();

  if (normalized.includes("DRAIN")) return "DRAINAGE";
  if (normalized.includes("ROAD") || normalized.includes("POTHOLE")) return "ROAD_DAMAGE";
  if (normalized.includes("LIGHT") || normalized.includes("STREET")) return "STREETLIGHT";
  if (normalized.includes("WATER")) return "WATER_LEAKAGE";
  if (normalized.includes("POWER") || normalized.includes("TRANSFORMER")) return "POWER_OUTAGE";
  if (normalized.includes("FOOTPATH")) return "FOOTPATH";
  if (normalized.includes("GARBAGE")) return "GARBAGE";

  return normalized;
}
