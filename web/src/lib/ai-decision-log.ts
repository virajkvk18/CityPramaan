"use client";

import type { AiAgentAudit } from "./ai-agents-client";

export type AiDecisionLogEntry = {
  id: string;
  createdAt: string;
  reportId?: string;
  agentName: string;
  decision: string;
  confidence?: number;
  mode: AiAgentAudit["mode"];
  provider: string;
  fallbackReason?: string;
  retrievedRuleIds: string[];
};

const AI_DECISION_LOG_KEY = "city-pramaan:ai-decision-log";
const MAX_DECISIONS = 80;

export function appendAiDecisionLog(
  entry: Omit<AiDecisionLogEntry, "id" | "createdAt">
) {
  if (typeof window === "undefined") {
    return;
  }

  const createdAt = new Date().toISOString();
  const nextEntry: AiDecisionLogEntry = {
    ...entry,
    id: `AI-${createdAt}-${Math.random().toString(16).slice(2, 8)}`,
    createdAt,
  };
  const current = getAiDecisionLog();
  const deduped = current.filter(
    (item) =>
      !(
        item.reportId === nextEntry.reportId &&
        item.agentName === nextEntry.agentName &&
        item.decision === nextEntry.decision
      )
  );

  window.localStorage.setItem(
    AI_DECISION_LOG_KEY,
    JSON.stringify([nextEntry, ...deduped].slice(0, MAX_DECISIONS))
  );
}

export function getAiDecisionLog(): AiDecisionLogEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(AI_DECISION_LOG_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as AiDecisionLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearAiDecisionLog() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AI_DECISION_LOG_KEY);
}
