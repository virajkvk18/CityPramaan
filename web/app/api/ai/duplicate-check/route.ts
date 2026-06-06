import { NextResponse } from "next/server";
import { asString, asStringArray, clampNumber, runJsonAgent } from "@/src/lib/ai-agent-server";
import type { CivicReport } from "@/src/lib/mock-data";

type DuplicateCheckResult = {
  duplicateLikely: boolean;
  similarityScore: number;
  matchedReportIds: string[];
  reason: string;
  recommendedAction: string;
  humanReviewRequired: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    report?: CivicReport;
    cityReports?: CivicReport[];
  };
  const report = body.report;
  const cityReports = body.cityReports ?? [];
  const fallback = buildDuplicateFallback(report, cityReports);

  const agent = await runJsonAgent<DuplicateCheckResult>({
    agentName: "Duplicate Complaint Agent",
    task:
      "Check whether this civic report is likely a duplicate or repeat of existing reports. Use same location, category, title similarity, and active warranty memory.",
    input: { report, cityReports: cityReports.slice(0, 20) },
    fallback,
    schema:
      '{ "duplicateLikely": boolean, "similarityScore": number, "matchedReportIds": string[], "reason": string, "recommendedAction": string, "humanReviewRequired": boolean }',
    ruleQuery: {
      text: `${report?.title ?? ""} ${report?.location ?? ""} ${report?.issueCategory ?? ""} duplicate repeat same location warranty`,
      category: report?.issueCategory,
      report,
      limit: 5,
    },
  });

  return NextResponse.json({
    ...agent,
    result: {
      duplicateLikely: Boolean(agent.result.duplicateLikely),
      similarityScore: clampNumber(agent.result.similarityScore, fallback.similarityScore),
      matchedReportIds: asStringArray(agent.result.matchedReportIds, fallback.matchedReportIds),
      reason: asString(agent.result.reason, fallback.reason),
      recommendedAction: asString(agent.result.recommendedAction, fallback.recommendedAction),
      humanReviewRequired:
        typeof agent.result.humanReviewRequired === "boolean"
          ? agent.result.humanReviewRequired
          : fallback.humanReviewRequired,
    },
  });
}

function buildDuplicateFallback(report?: CivicReport, cityReports: CivicReport[] = []): DuplicateCheckResult {
  if (!report) {
    return {
      duplicateLikely: false,
      similarityScore: 0,
      matchedReportIds: [],
      reason: "No report was provided for duplicate checking.",
      recommendedAction: "Run duplicate check after a report is selected.",
      humanReviewRequired: false,
    };
  }

  const sameAreaMatches = cityReports.filter((item) => {
    if (item.id === report.id) {
      return false;
    }

    const sameCategory = normalize(item.issueCategory) === normalize(report.issueCategory);
    const sameWard = normalize(item.ward) === normalize(report.ward);
    const nearText = normalize(item.location).slice(0, 28) === normalize(report.location).slice(0, 28);
    const titleOverlap = titleTerms(item.title).filter((term) => titleTerms(report.title).includes(term)).length;

    return sameCategory && (sameWard || nearText || titleOverlap >= 2);
  });
  const activeWarrantyMatches = sameAreaMatches.filter(
    (item) => item.warrantyStatus === "ACTIVE" || item.status === "UNDER_WARRANTY" || item.status === "REPEAT_FAILURE"
  );
  const similarityScore = Math.min(96, sameAreaMatches.length * 24 + activeWarrantyMatches.length * 22);

  return {
    duplicateLikely: similarityScore >= 55,
    similarityScore,
    matchedReportIds: sameAreaMatches.map((item) => item.id).slice(0, 6),
    reason: sameAreaMatches.length
      ? "Similar reports were found with matching category and nearby ward/location signals."
      : "No strong duplicate or repeat pattern was found in available city reports.",
    recommendedAction:
      similarityScore >= 70
        ? "Merge with existing proof timeline or mark as repeat/warranty review before assigning fresh work."
        : "Keep as separate report but continue monitoring for repeat-location evidence.",
    humanReviewRequired: similarityScore >= 55,
  };
}

function titleTerms(value?: string) {
  return normalize(value)
    .split(/\s+/)
    .filter((term) => term.length > 3);
}

function normalize(value?: string) {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}
