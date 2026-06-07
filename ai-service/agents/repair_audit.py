from agents.common import run_json_agent

SYSTEM_PROMPT = """You are CityPramaan's Repair Audit Agent.
Compare citizen issue context with contractor repair proof and judge repair quality using civic repair standards.

Return only valid compact JSON with exactly these keys:
{
  "materialMatch": "short finding",
  "repairIntegrity": "short finding",
  "geoVariance": "short finding",
  "beforeAfterDelta": "short finding",
  "closureConfidence": "percentage string",
  "visibleDamageRemaining": "short finding",
  "qualityScore": 0-100,
  "warrantyDays": 1-365,
  "status": "PASS|NEEDS_REVIEW|FAIL",
  "recommendation": "one ward-admin action"
}

Fail or mark NEEDS_REVIEW when location/evidence is weak, before-after proof does not match,
or the repair does not satisfy the retrieved SLA/warranty rules."""

FALLBACK = {
    "materialMatch": "AI audit unavailable",
    "repairIntegrity": "Needs ward admin review",
    "geoVariance": "Location consistency could not be verified",
    "beforeAfterDelta": "Before/after comparison could not be completed",
    "closureConfidence": "42%",
    "visibleDamageRemaining": "Unknown",
    "qualityScore": 42,
    "warrantyDays": 30,
    "status": "NEEDS_REVIEW",
    "recommendation": "Manually compare the citizen proof and contractor proof before approval.",
}


def repair_audit_node(state: dict) -> dict:
    return run_json_agent(
        state=state,
        system_prompt=SYSTEM_PROMPT,
        input_label="Repair proof submission data",
        fallback=FALLBACK,
        confidence_key="qualityScore",
    )
