import { NextResponse } from "next/server";
import { asString, asStringArray, runJsonAgent } from "@/src/lib/ai-agent-server";
import type { CivicReport } from "@/src/lib/mock-data";

type EscalationRiskResult = {
  escalationLevel: "NONE" | "WARD_REVIEW" | "URGENT" | "EMERGENCY";
  publicSafetyRisk: boolean;
  escalationReasons: string[];
  notifyRoles: string[];
  recommendedAction: string;
  humanReviewRequired: boolean;
};

const escalationLevels: EscalationRiskResult["escalationLevel"][] = [
  "NONE",
  "WARD_REVIEW",
  "URGENT",
  "EMERGENCY",
];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { report?: CivicReport };
  const report = body.report;
  const fallback = buildEscalationFallback(report);

  const agent = await runJsonAgent<EscalationRiskResult>({
    agentName: "Critical Escalation Agent",
    task:
      "Decide whether this civic issue needs ward review, urgent escalation, or emergency action. Consider public safety, health, electricity, traffic, school/market context, and SLA breach risk.",
    input: { report },
    fallback,
    schema:
      '{ "escalationLevel": "NONE|WARD_REVIEW|URGENT|EMERGENCY", "publicSafetyRisk": boolean, "escalationReasons": string[], "notifyRoles": string[], "recommendedAction": string, "humanReviewRequired": boolean }',
    ruleQuery: {
      text: `${report?.title ?? ""} ${report?.location ?? ""} ${report?.issueCategory ?? ""} ${report?.severity ?? ""} urgent emergency public safety health school market collapse open manhole transformer wire`,
      category: report?.issueCategory,
      report,
      limit: 5,
    },
  });

  return NextResponse.json({
    ...agent,
    result: {
      escalationLevel: asEscalationLevel(agent.result.escalationLevel) ?? fallback.escalationLevel,
      publicSafetyRisk:
        typeof agent.result.publicSafetyRisk === "boolean"
          ? agent.result.publicSafetyRisk
          : fallback.publicSafetyRisk,
      escalationReasons: asStringArray(agent.result.escalationReasons, fallback.escalationReasons),
      notifyRoles: asStringArray(agent.result.notifyRoles, fallback.notifyRoles),
      recommendedAction: asString(agent.result.recommendedAction, fallback.recommendedAction),
      humanReviewRequired:
        typeof agent.result.humanReviewRequired === "boolean"
          ? agent.result.humanReviewRequired
          : fallback.humanReviewRequired,
    },
  });
}

function buildEscalationFallback(report?: CivicReport): EscalationRiskResult {
  if (!report) {
    return {
      escalationLevel: "NONE",
      publicSafetyRisk: false,
      escalationReasons: ["No report was provided."],
      notifyRoles: [],
      recommendedAction: "Select a report before escalation analysis.",
      humanReviewRequired: false,
    };
  }

  const text = normalize(`${report.title} ${report.location} ${report.aiSummary} ${report.recommendedAction}`);
  const emergencyTerms = ["collapse", "caved", "sinkhole", "open manhole", "exposed wire", "electrocution", "bridge"];
  const urgentTerms = ["school", "market", "bus stop", "sewage", "contamination", "transformer", "blackout", "waterlogging"];
  const hasEmergency = emergencyTerms.some((term) => text.includes(term));
  const hasUrgent = urgentTerms.some((term) => text.includes(term));
  const criticalSeverity = normalize(report.severity) === "critical";
  const category = normalize(report.issueCategory);
  const publicSafetyRisk =
    hasEmergency || hasUrgent || criticalSeverity || ["power_outage", "drain_blockage", "road_damage"].includes(category);
  const escalationLevel = hasEmergency
    ? "EMERGENCY"
    : publicSafetyRisk || criticalSeverity
      ? "URGENT"
      : report.confidence < 65
        ? "WARD_REVIEW"
        : "NONE";

  return {
    escalationLevel,
    publicSafetyRisk,
    escalationReasons: [
      criticalSeverity ? "Report severity is critical." : "",
      hasEmergency ? "Emergency safety keywords are present." : "",
      hasUrgent ? "Public-health, traffic, or utility urgency keywords are present." : "",
      report.confidence < 65 ? "AI confidence is below the review threshold." : "",
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
      escalationLevel === "EMERGENCY"
        ? "Escalate immediately, add barricading/public warning if needed, and require priority contractor action."
        : escalationLevel === "URGENT"
          ? "Move to high-priority queue and assign a verified contractor within the SLA window."
          : escalationLevel === "WARD_REVIEW"
            ? "Ask ward admin to review because confidence or evidence is not strong enough."
            : "No escalation required beyond normal civic workflow.",
    humanReviewRequired: escalationLevel !== "NONE",
  };
}

function asEscalationLevel(value: unknown) {
  return typeof value === "string" && escalationLevels.includes(value as EscalationRiskResult["escalationLevel"])
    ? (value as EscalationRiskResult["escalationLevel"])
    : null;
}

function normalize(value?: string) {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}
