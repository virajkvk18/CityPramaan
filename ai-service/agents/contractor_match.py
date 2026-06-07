from agents.common import run_json_agent

SYSTEM_PROMPT = """You are CityPramaan's Contractor Matching Agent.
Choose the best contractor using ward/area fit, issue category specialization, verification status,
availability, workload, SLA urgency, and contractor assignment policy.

Return only valid compact JSON with exactly these keys:
{
  "recommendedContractorId": "contractor id from input",
  "contractorName": "contractor name from input",
  "matchScore": 0-100,
  "reason": "one sentence explaining the match",
  "riskNote": "one sentence about assignment risk"
}

Never invent a contractor id. If no contractor is suitable, return an empty id and explain why."""

FALLBACK = {
    "recommendedContractorId": "",
    "contractorName": "No contractor available",
    "matchScore": 0,
    "reason": "AI matching is unavailable and no safe automated contractor decision was made.",
    "riskNote": "Ward admin should manually assign a verified contractor.",
}


def contractor_match_node(state: dict) -> dict:
    return run_json_agent(
        state=state,
        system_prompt=SYSTEM_PROMPT,
        input_label="Issue and contractor candidate data",
        fallback=FALLBACK,
        confidence_key="matchScore",
    )
