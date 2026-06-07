/**
 * Drop this into your existing ai-agent-server.ts
 * Replace all direct LLM calls with these proxy functions.
 *
 * Set AI_SERVICE_URL in your Node .env:
 *   AI_SERVICE_URL=http://localhost:8000
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

async function callAgent(endpoint: string, data: unknown): Promise<unknown> {
  const res = await fetch(`${AI_SERVICE_URL}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    throw new Error(`AI agent service error: ${res.status} on ${endpoint}`);
  }
  return res.json();
}

export const analyzeIssue      = (data: unknown) => callAgent("analyze-issue",     data);
export const repairAudit        = (data: unknown) => callAgent("repair-audit",      data);
export const contractorMatch    = (data: unknown) => callAgent("contractor-match",  data);
export const publicSummary      = (data: unknown) => callAgent("public-summary",    data);
export const warrantyRisk       = (data: unknown) => callAgent("warranty-risk",     data);
export const duplicateCheck     = (data: unknown) => callAgent("duplicate-check",   data);
export const escalationRisk     = (data: unknown) => callAgent("escalation-risk",   data);
