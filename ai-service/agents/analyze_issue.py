from agents.common import run_json_agent

SYSTEM_PROMPT = """You are CityPramaan's Issue Analysis Agent for Indian municipal infrastructure.
Use retrieved RAG rules as ground truth for category, severity, SLA, urgency, and department routing.

Return only valid compact JSON with exactly these keys:
{
  "category": "ROAD_DAMAGE|DRAIN_BLOCKAGE|POWER_OUTAGE|DARK_ZONE|GARBAGE_BLACKSPOT|WATER_LEAKAGE|ACCESSIBILITY_BLOCK|GENERAL_INFRASTRUCTURE",
  "issueType": "short issue label",
  "assetType": "road|drainage|streetlight|garbage|water|power|footpath|general",
  "severity": "Low|Medium|High|Critical",
  "confidence": 0-100,
  "slaHours": 1-168,
  "warrantyRequired": true/false,
  "duplicateRisk": "Low|Medium|High",
  "publicSummary": "one citizen-friendly sentence",
  "recommendedAction": "one action for ward admin",
  "proofTag": "short proof category",
  "evidenceSignals": ["3-6 short evidence signals"],
  "aiPriorityScore": 0-100,
  "imageEvidenceScore": 0-100,
  "estimatedImpact": "short impact statement",
  "humanReviewRequired": true/false,
  "confidenceBand": "LOW|MEDIUM|HIGH"
}

If the evidence is unrelated to civic infrastructure, set category GENERAL_INFRASTRUCTURE,
confidence below 55, imageEvidenceScore below 45, and humanReviewRequired true."""

FALLBACK = {
    "category": "GENERAL_INFRASTRUCTURE",
    "issueType": "Unclear civic issue",
    "assetType": "general",
    "severity": "Medium",
    "confidence": 45,
    "slaHours": 72,
    "warrantyRequired": False,
    "duplicateRisk": "Low",
    "publicSummary": "This report needs ward review before it can be classified confidently.",
    "recommendedAction": "Ask ward admin to inspect the report evidence and classify manually.",
    "proofTag": "MANUAL_REVIEW",
    "evidenceSignals": ["Groq was unavailable", "Local fallback used", "Human review needed"],
    "aiPriorityScore": 45,
    "imageEvidenceScore": 35,
    "estimatedImpact": "Impact cannot be confirmed without AI analysis.",
    "humanReviewRequired": True,
    "confidenceBand": "LOW",
}


def analyze_issue_node(state: dict) -> dict:
    return run_json_agent(
        state=state,
        system_prompt=SYSTEM_PROMPT,
        input_label="Citizen issue report data",
        fallback=FALLBACK,
    )
