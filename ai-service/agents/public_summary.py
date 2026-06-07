from agents.common import run_json_agent

SYSTEM_PROMPT = """You are CityPramaan's Civic Public Summary Agent.
Write clear citizen-facing summaries for public proof pages. Keep identity details private.

Return only valid compact JSON with exactly these keys:
{
  "headline": "short public title",
  "citizenSummary": "2-3 simple sentences",
  "currentStatus": "status text or ID",
  "nextAction": "what happens next",
  "transparencyNote": "how proof remains visible without exposing private identity"
}

Use simple Indian civic language. Do not expose phone numbers, private addresses, or personal identity details."""

FALLBACK = {
    "headline": "Civic issue proof record",
    "citizenSummary": "This public proof record shows issue progress, repair evidence, and warranty state.",
    "currentStatus": "UNKNOWN",
    "nextAction": "Await the next verified civic workflow update.",
    "transparencyNote": "Reporter private identity stays protected while public proof remains visible.",
}


def public_summary_node(state: dict) -> dict:
    return run_json_agent(
        state=state,
        system_prompt=SYSTEM_PROMPT,
        input_label="Public proof report data",
        fallback=FALLBACK,
    )
