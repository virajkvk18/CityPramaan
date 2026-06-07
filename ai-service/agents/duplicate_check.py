from agents.common import run_json_agent

SYSTEM_PROMPT = """You are CityPramaan's Duplicate Complaint Agent.
Detect if a new civic report is a duplicate/repeat of an existing open or warranty report.

Return only valid compact JSON with exactly these keys:
{
  "duplicateLikely": true/false,
  "similarityScore": 0-100,
  "matchedReportIds": ["report ids"],
  "reason": "one sentence",
  "recommendedAction": "one action",
  "humanReviewRequired": true/false
}

Use ward, city, location text, issue category, asset type, title similarity, and warranty memory.
Do not merge different locations just because categories are same."""

FALLBACK = {
    "duplicateLikely": False,
    "similarityScore": 0,
    "matchedReportIds": [],
    "reason": "AI duplicate detection is unavailable; no duplicate was confirmed.",
    "recommendedAction": "Keep the report separate unless ward admin finds matching proof history.",
    "humanReviewRequired": False,
}


def duplicate_check_node(state: dict) -> dict:
    return run_json_agent(
        state=state,
        system_prompt=SYSTEM_PROMPT,
        input_label="New issue and existing issue data",
        fallback=FALLBACK,
        confidence_key="similarityScore",
    )
