from agents.common import run_json_agent

SYSTEM_PROMPT = """You are CityPramaan's Critical Escalation Agent.
Decide whether a civic issue needs ward review, urgent escalation, or emergency action.

Return only valid compact JSON with exactly these keys:
{
  "escalationLevel": "NONE|WARD_REVIEW|URGENT|EMERGENCY",
  "publicSafetyRisk": true/false,
  "escalationReasons": ["short reasons"],
  "notifyRoles": ["Ward Admin", "Contractor Lead", "Emergency Field Supervisor"],
  "recommendedAction": "one action",
  "humanReviewRequired": true/false
}

Consider public safety, health risk, traffic blockage, school/market proximity, exposed wires,
open manholes, bridge/road collapse, sewage contamination, transformer/power risk, and SLA breach."""

FALLBACK = {
    "escalationLevel": "WARD_REVIEW",
    "publicSafetyRisk": False,
    "escalationReasons": ["AI escalation analysis is unavailable."],
    "notifyRoles": ["Ward Admin"],
    "recommendedAction": "Ask ward admin to review the issue manually before assignment.",
    "humanReviewRequired": True,
}


def escalation_risk_node(state: dict) -> dict:
    return run_json_agent(
        state=state,
        system_prompt=SYSTEM_PROMPT,
        input_label="Issue status and history data",
        fallback=FALLBACK,
    )
