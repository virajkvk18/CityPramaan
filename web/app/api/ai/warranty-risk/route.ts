import { NextResponse } from "next/server";
import { asString, asStringArray, clampNumber, runJsonAgent } from "@/src/lib/ai-agent-server";
import type { CivicReport } from "@/src/lib/mock-data";

type WarrantyRiskBody = {
  report?: CivicReport;
  cityReports?: CivicReport[];
};

type WarrantyRiskResult = {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  repeatProbability: number;
  warrantyBreachLikely: boolean;
  matchedReportIds: string[];
  reason: string;
  recommendedAction: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as WarrantyRiskBody;
  const report = body.report;
  const nearbyReports = body.cityReports ?? [];
  const fallback = buildFallback(report, nearbyReports);

  const agent = await runJsonAgent<WarrantyRiskResult>({
    agentName: "Warranty Risk Agent",
    task:
      "Detect repeat civic failure and warranty risk using current report, location text, category, status, and nearby/history reports.",
    input: {
      report,
      cityReports: nearbyReports.slice(0, 20).map((item) => ({
        id: item.id,
        title: item.title,
        location: item.location,
        issueCategory: item.issueCategory,
        status: item.status,
        warrantyStatus: item.warrantyStatus,
        createdAt: item.createdAt,
        warrantyExpiresAt: item.warrantyExpiresAt,
      })),
    },
    fallback,
    schema:
      '{ "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL", "repeatProbability": number 0-100, "warrantyBreachLikely": boolean, "matchedReportIds": string[], "reason": string, "recommendedAction": string }',
    ruleQuery: {
      text: `${report?.title ?? ""} ${report?.location ?? ""} repeat warranty same location`,
      category: report?.issueCategory,
      report,
      limit: 5,
    },
  });

  return NextResponse.json({
    ...agent,
    result: sanitize(agent.result, fallback),
  });
}

function buildFallback(report?: CivicReport, reports: CivicReport[] = []): WarrantyRiskResult {
  const currentLocation = normalize(report?.location);
  const currentCategory = normalize(report?.issueCategory);
  const matches = reports.filter(
    (item) =>
      item.id !== report?.id &&
      normalize(item.location).slice(0, 24) === currentLocation.slice(0, 24) &&
      normalize(item.issueCategory) === currentCategory
  );
  const repeatProbability = Math.min(95, matches.length * 28 + (report?.warrantyStatus === "ACTIVE" ? 22 : 0));

  return {
    riskLevel: repeatProbability > 75 ? "HIGH" : repeatProbability > 40 ? "MEDIUM" : "LOW",
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

function sanitize(raw: WarrantyRiskResult, fallback: WarrantyRiskResult): WarrantyRiskResult {
  const riskLevel = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(String(raw.riskLevel))
    ? raw.riskLevel
    : fallback.riskLevel;

  return {
    riskLevel,
    repeatProbability: clampNumber(raw.repeatProbability, fallback.repeatProbability),
    warrantyBreachLikely:
      typeof raw.warrantyBreachLikely === "boolean" ? raw.warrantyBreachLikely : fallback.warrantyBreachLikely,
    matchedReportIds: asStringArray(raw.matchedReportIds, fallback.matchedReportIds),
    reason: asString(raw.reason, fallback.reason),
    recommendedAction: asString(raw.recommendedAction, fallback.recommendedAction),
  };
}

function normalize(value?: string) {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}
