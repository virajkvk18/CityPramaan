import { NextResponse } from "next/server";
import {
  analyzeInfrastructureIssue,
  type InfrastructureAnalysis,
  type InfrastructureCategory,
} from "@/src/lib/infrastructure-analyzer";
import { formatRetrievedRulesForPrompt, retrieveCivicRules } from "@/src/lib/civic-rag-rules";

type AnalyzeIssueBody = {
  description?: string;
  imageName?: string;
  imageDataUrl?: string;
  location?: string;
  cityName?: string;
};

type ProviderConfig = {
  provider: "groq" | "xai";
  label: string;
  endpoint: string;
  apiKey: string;
  model: string;
};

const allowedCategories: InfrastructureCategory[] = [
  "ROAD_DAMAGE",
  "DRAIN_BLOCKAGE",
  "POWER_OUTAGE",
  "DARK_ZONE",
  "GARBAGE_BLACKSPOT",
  "WATER_LEAKAGE",
  "ACCESSIBILITY_BLOCK",
  "GENERAL_INFRASTRUCTURE",
];

const allowedSeverities: InfrastructureAnalysis["severity"][] = ["Low", "Medium", "High", "Critical"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AnalyzeIssueBody;
  const input = normalizeInput(body);
  const fallback = analyzeInfrastructureIssue(input);
  const retrievedRules = retrieveCivicRules({
    text: `${input.description} ${input.imageName} ${input.location}`,
    category: fallback.category,
    city: input.cityName,
    limit: 5,
  });
  const provider = getProviderConfig();

  if (!provider) {
    return NextResponse.json({
      mode: "ruleset-fallback",
      provider: "local",
      fallbackReason: "No CITYPRAMAAN_GROQ_API_KEY or CITYPRAMAAN_XAI_API_KEY configured.",
      retrievedRules,
      analysis: {
        ...fallback,
        modelVersion: `${fallback.modelVersion} + RAG (no API key fallback)`,
        aiMode: "ruleset-fallback",
        aiProvider: "local",
        aiFallbackReason: "No CITYPRAMAAN_GROQ_API_KEY or CITYPRAMAAN_XAI_API_KEY configured.",
      },
    });
  }

  try {
    const completion = await callVisionProvider(provider, input, fallback, retrievedRules);
    const content = completion?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI provider returned an empty response.");
    }

    const parsed = parseJsonObject(content);
    const analysis = sanitizeAnalysis(parsed, fallback, provider);

    return NextResponse.json({
      mode: "real-ai",
      provider: provider.provider,
      retrievedRules,
      analysis: {
        ...analysis,
        aiMode: "real-ai",
        aiProvider: provider.label,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI provider request failed.";

    return NextResponse.json({
      mode: "ruleset-fallback",
      provider: provider.provider,
      fallbackReason: message,
      retrievedRules,
      analysis: {
        ...fallback,
        modelVersion: `${fallback.modelVersion} + RAG (AI fallback: ${provider.label})`,
        aiMode: "ruleset-fallback",
        aiProvider: provider.label,
        aiFallbackReason: message,
      },
    });
  }
}

function normalizeInput(body: AnalyzeIssueBody) {
  return {
    description: body.description?.trim() || "Civic infrastructure issue reported by citizen.",
    imageName: body.imageName?.trim() || "",
    imageDataUrl: body.imageDataUrl?.trim() || "",
    location: body.location?.trim() || "Unknown location",
    cityName: body.cityName?.trim() || "Selected city",
  };
}

function getProviderConfig(): ProviderConfig | null {
  const groqKey = process.env.CITYPRAMAAN_GROQ_API_KEY;

  if (groqKey) {
    return {
      provider: "groq",
      label: "Groq Vision",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groqKey,
      model: process.env.CITYPRAMAAN_GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
    };
  }

  const xaiKey = process.env.CITYPRAMAAN_XAI_API_KEY;

  if (xaiKey) {
    return {
      provider: "xai",
      label: "xAI Grok Vision",
      endpoint: "https://api.x.ai/v1/chat/completions",
      apiKey: xaiKey,
      model: process.env.CITYPRAMAAN_XAI_MODEL || "grok-2-vision-1212",
    };
  }

  return null;
}

async function callVisionProvider(
  provider: ProviderConfig,
  input: ReturnType<typeof normalizeInput>,
  fallback: InfrastructureAnalysis,
  retrievedRules: ReturnType<typeof retrieveCivicRules>
) {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text: buildPrompt(input, fallback, retrievedRules),
    },
  ];

  if (input.imageDataUrl && input.imageDataUrl.length < 3_900_000) {
    content.push({
      type: "image_url",
      image_url: {
        url: input.imageDataUrl,
      },
    });
  }

  const payload: Record<string, unknown> = {
    model: provider.model,
    messages: [
      {
        role: "system",
        content:
          "You are CityPramaan's civic infrastructure AI. Analyze Indian city infrastructure reports. Return only valid compact JSON.",
      },
      {
        role: "user",
        content,
      },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  };

  if (provider.provider === "groq") {
    payload.max_completion_tokens = 900;
  } else {
    payload.max_tokens = 900;
  }

  const response = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${provider.label} failed with ${response.status}: ${text.slice(0, 240)}`);
  }

  return response.json() as Promise<{
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  }>;
}

function buildPrompt(
  input: ReturnType<typeof normalizeInput>,
  fallback: InfrastructureAnalysis,
  retrievedRules: ReturnType<typeof retrieveCivicRules>
) {
  return `
Analyze this CityPramaan civic issue using the image when present and the retrieved civic rules as ground truth.

Citizen description: ${input.description}
Image filename: ${input.imageName || "not provided"}
Location: ${input.location}
City: ${input.cityName}

Retrieved civic rules / RAG context:
${formatRetrievedRulesForPrompt(retrievedRules)}

Allowed categories:
${allowedCategories.join(", ")}

Return JSON with exactly these keys:
category, issueType, assetType, severity, confidence, slaHours, warrantyRequired, duplicateRisk,
publicSummary, recommendedAction, proofTag, evidenceSignals, aiPriorityScore, imageEvidenceScore,
estimatedImpact, humanReviewRequired, confidenceBand.

Rules:
- category must be one of the allowed categories.
- severity must be Low, Medium, High, or Critical.
- confidence, aiPriorityScore, imageEvidenceScore must be 0-100 numbers.
- confidenceBand must be LOW, MEDIUM, or HIGH.
- humanReviewRequired must be true when confidence is below 70, image evidence is weak, or public safety is critical.
- evidenceSignals must be 3-6 short strings.
- publicSummary must mention the issue, location, and public proof tracking.
- slaHours and warrantyRequired must follow retrieved civic rules when relevant.
- If image evidence is unclear, say so in evidenceSignals and reduce imageEvidenceScore.
- If the image looks like a dashboard, document, random screenshot, selfie, indoor object, or anything unrelated to civic infrastructure, return GENERAL_INFRASTRUCTURE, issueType "Unclear / Non-civic Evidence", confidence below 55, imageEvidenceScore below 45, and humanReviewRequired true.
- Do not copy the baseline local ruleset if the image contradicts the text.
- Prefer practical Indian municipal actions.

Baseline local ruleset result for fallback reference only, not as truth:
${JSON.stringify(fallback)}
`.trim();
}

function parseJsonObject(content: string) {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("AI response was not JSON.");
    }

    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

function sanitizeAnalysis(
  raw: Record<string, unknown>,
  fallback: InfrastructureAnalysis,
  provider: ProviderConfig
): InfrastructureAnalysis {
  const category = asCategory(raw.category) ?? fallback.category;
  const severity = asSeverity(raw.severity) ?? fallback.severity;
  const confidence = clampNumber(raw.confidence, fallback.confidence);
  const slaHours = Math.max(1, Math.round(clampNumber(raw.slaHours, fallback.slaHours, 168)));
  const aiPriorityScore = clampNumber(raw.aiPriorityScore, fallback.aiPriorityScore);
  const imageEvidenceScore = clampNumber(raw.imageEvidenceScore, fallback.imageEvidenceScore);
  const evidenceSignals = asStringArray(raw.evidenceSignals, fallback.evidenceSignals);
  const confidenceBand = asConfidenceBand(raw.confidenceBand) ?? bandForConfidence(confidence);

  return {
    category,
    issueType: asString(raw.issueType, fallback.issueType),
    assetType: asString(raw.assetType, fallback.assetType),
    severity,
    confidence,
    slaHours,
    warrantyRequired:
      typeof raw.warrantyRequired === "boolean" ? raw.warrantyRequired : fallback.warrantyRequired,
    duplicateRisk: asString(raw.duplicateRisk, fallback.duplicateRisk),
    publicSummary: asString(raw.publicSummary, fallback.publicSummary),
    recommendedAction: asString(raw.recommendedAction, fallback.recommendedAction),
    proofTag: asString(raw.proofTag, fallback.proofTag),
    evidenceSignals,
    aiPriorityScore,
    imageEvidenceScore,
    estimatedImpact: asString(raw.estimatedImpact, fallback.estimatedImpact),
    modelVersion: `${provider.label} | ${provider.model}`,
    humanReviewRequired:
      typeof raw.humanReviewRequired === "boolean"
        ? raw.humanReviewRequired
        : confidence < 70 || imageEvidenceScore < 55 || severity === "Critical",
    confidenceBand,
  };
}

function asCategory(value: unknown): InfrastructureCategory | null {
  return typeof value === "string" && allowedCategories.includes(value as InfrastructureCategory)
    ? (value as InfrastructureCategory)
    : null;
}

function asSeverity(value: unknown): InfrastructureAnalysis["severity"] | null {
  return typeof value === "string" && allowedSeverities.includes(value as InfrastructureAnalysis["severity"])
    ? (value as InfrastructureAnalysis["severity"])
    : null;
}

function asConfidenceBand(value: unknown): InfrastructureAnalysis["confidenceBand"] | null {
  return value === "LOW" || value === "MEDIUM" || value === "HIGH" ? value : null;
}

function bandForConfidence(confidence: number): InfrastructureAnalysis["confidenceBand"] {
  if (confidence >= 85) {
    return "HIGH";
  }

  if (confidence >= 65) {
    return "MEDIUM";
  }

  return "LOW";
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const values = value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
  return values.length ? values.slice(0, 6) : fallback;
}

function clampNumber(value: unknown, fallback: number, max = 100) {
  const number = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(0, Math.min(max, Math.round(number)));
}
