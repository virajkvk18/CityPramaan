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
      return fallback;
    }

    const payload = (await response.json()) as AnalyzeIssueResponse;

    if (!payload.analysis) {
      return fallback;
    }

    return payload.analysis;
  } catch (error) {
    console.warn("CityPramaan real AI analysis unavailable:", error);
    return fallback;
  }
}
