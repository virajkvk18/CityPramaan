import { NextResponse } from "next/server";
import { asString, runJsonAgent } from "@/src/lib/ai-agent-server";
import type { CivicReport } from "@/src/lib/mock-data";

type PublicSummaryResult = {
  headline: string;
  citizenSummary: string;
  currentStatus: string;
  nextAction: string;
  transparencyNote: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { report?: CivicReport };
  const report = body.report;
  const fallback: PublicSummaryResult = {
    headline: report?.title ?? "Civic issue proof record",
    citizenSummary:
      report?.aiSummary ??
      "This public proof record shows the issue, repair progress, contractor proof, and warranty state.",
    currentStatus: report?.status ?? "UNKNOWN",
    nextAction: report?.recommendedAction ?? "Await the next verified civic workflow update.",
    transparencyNote: "Reporter private identity stays protected while public proof remains visible.",
  };

  const agent = await runJsonAgent<PublicSummaryResult>({
    agentName: "Civic Public Summary Agent",
    task: "Create a citizen-friendly public proof summary without exposing private identity details.",
    input: { report },
    fallback,
    schema:
      '{ "headline": string, "citizenSummary": string, "currentStatus": string, "nextAction": string, "transparencyNote": string }',
    ruleQuery: {
      text: `${report?.title ?? ""} ${report?.location ?? ""} ${report?.status ?? ""} public summary proof`,
      category: report?.issueCategory,
      report,
      limit: 4,
    },
  });

  return NextResponse.json({
    ...agent,
    result: {
      headline: asString(agent.result.headline, fallback.headline),
      citizenSummary: asString(agent.result.citizenSummary, fallback.citizenSummary),
      currentStatus: asString(agent.result.currentStatus, fallback.currentStatus),
      nextAction: asString(agent.result.nextAction, fallback.nextAction),
      transparencyNote: asString(agent.result.transparencyNote, fallback.transparencyNote),
    },
  });
}
