import {
  formatRetrievedRulesForPrompt,
  retrieveCivicRules,
  type RetrievedRule,
} from "./civic-rag-rules";
import { formatKnowledgeDocumentsForPrompt } from "./civic-rag-documents";
import type { ContractorProfile, CivicReport } from "./mock-data";

export type AiProviderConfig = {
  provider: "groq" | "xai";
  label: string;
  endpoint: string;
  apiKey: string;
  model: string;
};

export type AiAgentResult<T> = {
  mode: "real-ai" | "ruleset-fallback";
  provider: "groq" | "xai" | "local";
  fallbackReason?: string;
  retrievedRules: RetrievedRule[];
  result: T;
  agentTrace: {
    agentName: string;
    retrievedRuleIds: string[];
    providerLabel: string;
  };
};

export function getAiProviderConfig(): AiProviderConfig | null {
  const groqKey = process.env.CITYPRAMAAN_GROQ_API_KEY;

  if (groqKey) {
    return {
      provider: "groq",
      label: "Groq",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groqKey,
      model: process.env.CITYPRAMAAN_GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
    };
  }

  const xaiKey = process.env.CITYPRAMAAN_XAI_API_KEY;

  if (xaiKey) {
    return {
      provider: "xai",
      label: "xAI",
      endpoint: "https://api.x.ai/v1/chat/completions",
      apiKey: xaiKey,
      model: process.env.CITYPRAMAAN_XAI_MODEL || "grok-2-vision-1212",
    };
  }

  return null;
}

export async function runJsonAgent<T>({
  agentName,
  task,
  input,
  fallback,
  schema,
  imageDataUrls = [],
  ruleQuery,
}: {
  agentName: string;
  task: string;
  input: unknown;
  fallback: T;
  schema: string;
  imageDataUrls?: string[];
  ruleQuery: {
    text?: string;
    category?: string;
    city?: string;
    report?: Partial<CivicReport>;
    contractor?: Partial<ContractorProfile>;
    limit?: number;
  };
}): Promise<AiAgentResult<T>> {
  const retrievedRules = retrieveCivicRules(ruleQuery);
  const externalEndpoint = getExternalAiServiceEndpoint(agentName);
  const externalUrl = process.env.AI_SERVICE_URL;

  if (externalUrl && externalEndpoint) {
    try {
      const result = await callExternalAiService<T>(externalUrl, externalEndpoint, input);

      return {
        mode: "real-ai",
        provider: "groq",
        retrievedRules,
        result,
        agentTrace: buildAgentTrace(agentName, retrievedRules, "Groq via AI service"),
      };
    } catch (error) {
      console.warn(
        `CityPramaan AI service failed for ${agentName}; falling back to direct provider/local rules:`,
        error
      );
    }
  }

  const provider = getAiProviderConfig();

  if (!provider) {
    return {
      mode: "ruleset-fallback",
      provider: "local",
      fallbackReason: "No CITYPRAMAAN_GROQ_API_KEY or CITYPRAMAAN_XAI_API_KEY configured.",
      retrievedRules,
      result: fallback,
      agentTrace: buildAgentTrace(agentName, retrievedRules, "Local ruleset"),
    };
  }

  try {
    const raw = await callChatCompletion({
      provider,
      agentName,
      task,
      input,
      schema,
      retrievedRules,
      imageDataUrls,
    });

    return {
      mode: "real-ai",
      provider: provider.provider,
      retrievedRules,
      result: parseJsonObject(raw) as T,
      agentTrace: buildAgentTrace(agentName, retrievedRules, provider.label),
    };
  } catch (error) {
    return {
      mode: "ruleset-fallback",
      provider: provider.provider,
      fallbackReason: error instanceof Error ? error.message : "AI provider request failed.",
      retrievedRules,
      result: fallback,
      agentTrace: buildAgentTrace(agentName, retrievedRules, provider.label),
    };
  }
}

async function callExternalAiService<T>(baseUrl: string, endpoint: string, input: unknown): Promise<T> {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${normalizedBase}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: input }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`AI service failed with ${response.status}: ${text.slice(0, 240)}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("AI service timed out after 20 seconds.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getExternalAiServiceEndpoint(agentName: string) {
  const normalized = agentName.toLowerCase();

  if (normalized.includes("contractor")) return "contractor-match";
  if (normalized.includes("repair audit")) return "repair-audit";
  if (normalized.includes("public summary")) return "public-summary";
  if (normalized.includes("warranty")) return "warranty-risk";
  if (normalized.includes("duplicate")) return "duplicate-check";
  if (normalized.includes("escalation")) return "escalation-risk";

  return null;
}

async function callChatCompletion({
  provider,
  agentName,
  task,
  input,
  schema,
  retrievedRules,
  imageDataUrls,
}: {
  provider: AiProviderConfig;
  agentName: string;
  task: string;
  input: unknown;
  schema: string;
  retrievedRules: RetrievedRule[];
  imageDataUrls: string[];
}) {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text: `
Agent: ${agentName}
Task: ${task}

Retrieved CityPramaan civic rules:
${formatRetrievedRulesForPrompt(retrievedRules)}

Retrieved CityPramaan policy documents:
${formatKnowledgeDocumentsForPrompt(
  `${task} ${JSON.stringify(input).slice(0, 1200)} ${retrievedRules.map((rule) => rule.title).join(" ")}`
)}

Input data:
${JSON.stringify(input, null, 2)}

Return only compact valid JSON. Do not add markdown.
JSON schema / required keys:
${schema}
`.trim(),
    },
  ];

  for (const imageDataUrl of imageDataUrls.filter((url) => url && url.length < 3_900_000).slice(0, 2)) {
    content.push({
      type: "image_url",
      image_url: { url: imageDataUrl },
    });
  }

  const payload: Record<string, unknown> = {
    model: provider.model,
    messages: [
      {
        role: "system",
        content:
          "You are a CityPramaan civic AI agent for Indian municipal issue verification. Use the retrieved rules as ground truth. Return only valid JSON.",
      },
      {
        role: "user",
        content,
      },
    ],
    temperature: 0.12,
    response_format: { type: "json_object" },
  };

  if (provider.provider === "groq") {
    payload.max_completion_tokens = 1000;
  } else {
    payload.max_tokens = 1000;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);
  let response: Response;

  try {
    response = await fetch(provider.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`${provider.label} timed out after 18 seconds.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${provider.label} failed with ${response.status}: ${text.slice(0, 240)}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const contentText = json.choices?.[0]?.message?.content;

  if (!contentText) {
    throw new Error(`${provider.label} returned an empty response.`);
  }

  return contentText;
}

export function parseJsonObject(content: string) {
  const withoutCodeFence = content
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutCodeFence) as Record<string, unknown>;
  } catch {
    const match = withoutCodeFence.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("AI response was not JSON.");
    }

    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

function buildAgentTrace(agentName: string, retrievedRules: RetrievedRule[], providerLabel: string) {
  return {
    agentName,
    retrievedRuleIds: retrievedRules.map((rule) => rule.id),
    providerLabel,
  };
}

export function clampNumber(value: unknown, fallback: number, max = 100) {
  const number = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(0, Math.min(max, Math.round(number)));
}

export function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const values = value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
  return values.length ? values.slice(0, 8) : fallback;
}
