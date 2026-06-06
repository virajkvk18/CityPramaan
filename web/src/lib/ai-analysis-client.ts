"use client";

import {
  analyzeInfrastructureIssue,
  type InfrastructureAnalysis,
} from "./infrastructure-analyzer";

type RequestInfrastructureAnalysisInput = {
  description: string;
  imageName?: string;
  imageDataUrl?: string;
  location: string;
  cityName: string;
};

type AnalyzeIssueResponse = {
  mode?: "real-ai" | "ruleset-fallback";
  provider?: string;
  fallbackReason?: string;
  analysis?: InfrastructureAnalysis;
};

export async function requestInfrastructureAnalysis(
  input: RequestInfrastructureAnalysisInput
): Promise<InfrastructureAnalysis> {
  const fallback = {
    ...analyzeInfrastructureIssue(input),
    modelVersion: "CityPramaan Ruleset v0.4 (offline fallback)",
    aiMode: "ruleset-fallback" as const,
    aiProvider: "local",
    aiFallbackReason: "Browser could not reach the AI analysis API.",
  };

  try {
    const response = await fetch("/api/ai/analyze-issue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return {
        ...fallback,
        aiFallbackReason: `AI analysis API returned ${response.status}.`,
      };
    }

    const payload = (await response.json()) as AnalyzeIssueResponse;

    if (!payload.analysis) {
      return fallback;
    }

    return {
      ...payload.analysis,
      aiMode: payload.analysis.aiMode ?? payload.mode ?? "real-ai",
      aiProvider: payload.analysis.aiProvider ?? payload.provider ?? "configured AI",
      aiFallbackReason: payload.analysis.aiFallbackReason ?? payload.fallbackReason,
    };
  } catch (error) {
    console.warn("CityPramaan real AI analysis unavailable:", error);
    return fallback;
  }
}
