from agents.common import run_json_agent

SYSTEM_PROMPT = """You are CityPramaan's Warranty Risk Agent.
Detect repeat failures, warranty breach risk, and same-location civic issue recurrence.

Return only valid compact JSON with exactly these keys:
{
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "repeatProbability": 0-100,
  "warrantyBreachLikely": true/false,
  "matchedReportIds": ["report ids"],
  "reason": "one sentence",
  "recommendedAction": "one action for ward admin"
}

Use current report, location, category, repair date, warranty period, and history reports.
Flag high risk when the same category repeats at the same/nearby location during warranty."""

FALLBACK = {
    "riskLevel": "LOW",
    "repeatProbability": 0,
    "warrantyBreachLikely": False,
    "matchedReportIds": [],
    "reason": "AI warranty analysis is unavailable; no repeat pattern was confirmed.",
    "recommendedAction": "Continue normal monitoring and run manual review if evidence suggests recurrence.",
}


def warranty_risk_node(state: dict) -> dict:
    return run_json_agent(
        state=state,
        system_prompt=SYSTEM_PROMPT,
        input_label="Repair and warranty data",
        fallback=FALLBACK,
        confidence_key="repeatProbability",
    )
