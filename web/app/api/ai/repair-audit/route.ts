import { NextResponse } from "next/server";
import {
  asString,
  clampNumber,
  runJsonAgent,
} from "@/src/lib/ai-agent-server";

type RepairAuditBody = {
  report?: {
    id?: string;
    title?: string;
    location?: string;
    ward?: string;
    issueCategory?: string;
    severity?: string;
    aiSummary?: string;
    recommendedAction?: string;
    issueImageDataUrl?: string;
  };
  repairImageName?: string;
  repairImageDataUrl?: string;
  repairNotes?: string;
  contractorName?: string;
};

type RepairAuditResult = {
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

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RepairAuditBody;
  const report = body.report ?? {};
  const fallback = buildFallback(body);

  const agent = await runJsonAgent<RepairAuditResult>({
    agentName: "Repair Audit Agent",
    task:
      "Compare citizen report context with contractor repair proof. Judge whether repair proof is sufficient for ward admin approval and warranty activation.",
    input: {
      report,
      repairImageName: body.repairImageName,
      repairNotes: body.repairNotes,
      contractorName: body.contractorName,
    },
    fallback,
    schema:
      '{ "materialMatch": string, "repairIntegrity": string, "geoVariance": string, "beforeAfterDelta": string, "closureConfidence": string, "visibleDamageRemaining": string, "qualityScore": number 0-100, "warrantyDays": number, "status": "PASS" | "NEEDS_REVIEW" | "FAIL", "recommendation": string }',
    imageDataUrls: [report.issueImageDataUrl ?? "", body.repairImageDataUrl ?? ""],
    ruleQuery: {
      text: `${report.title ?? ""} ${report.location ?? ""} ${body.repairNotes ?? ""}`,
      category: report.issueCategory,
      report,
      limit: 5,
    },
  });

  return NextResponse.json({
    ...agent,
    result: sanitize(agent.result, fallback),
  });
}

function buildFallback(body: RepairAuditBody): RepairAuditResult {
  const category = body.report?.issueCategory ?? "";
  const isPower = category.includes("POWER");
  const isDrain = category.includes("DRAIN");

  return {
    materialMatch: isPower ? "Restoration signal requires issuer review" : "Visual repair proof attached",
    repairIntegrity: "Needs issuer review",
    geoVariance: "Location consistency pending",
    beforeAfterDelta: isPower ? "Outage restoration proof submitted" : "After-repair evidence submitted",
    closureConfidence: body.repairImageDataUrl ? "74%" : "42%",
    visibleDamageRemaining: "Unknown until AI vision is available",
    qualityScore: body.repairImageDataUrl ? 74 : 42,
    warrantyDays: isDrain ? 15 : isPower ? 7 : 30,
    status: body.repairImageDataUrl ? "NEEDS_REVIEW" : "FAIL",
    recommendation:
      "AI provider is unavailable, so ward admin should manually compare before/after proof before approval.",
  };
}

function sanitize(raw: RepairAuditResult, fallback: RepairAuditResult): RepairAuditResult {
  const status = ["PASS", "NEEDS_REVIEW", "FAIL"].includes(String(raw.status))
    ? raw.status
    : fallback.status;
  const qualityScore = clampNumber(raw.qualityScore, fallback.qualityScore);

  return {
    materialMatch: asString(raw.materialMatch, fallback.materialMatch),
    repairIntegrity: asString(raw.repairIntegrity, fallback.repairIntegrity),
    geoVariance: asString(raw.geoVariance, fallback.geoVariance),
    beforeAfterDelta: asString(raw.beforeAfterDelta, fallback.beforeAfterDelta),
    closureConfidence: asString(raw.closureConfidence, `${qualityScore}%`),
    visibleDamageRemaining: asString(raw.visibleDamageRemaining, fallback.visibleDamageRemaining),
    qualityScore,
    warrantyDays: Math.max(1, clampNumber(raw.warrantyDays, fallback.warrantyDays, 365)),
    status,
    recommendation: asString(raw.recommendation, fallback.recommendation),
  };
}
