import json
import os
from langchain_groq import ChatGroq
from langchain.schema import SystemMessage, HumanMessage

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=os.getenv("GROQ_API_KEY_AGENTS"))

SYSTEM_PROMPT = """You are a duplicate issue detector for a civic issue tracking system.
Determine if an incoming issue is a duplicate of existing open issues.

Respond ONLY with valid JSON — no markdown, no explanation, no preamble.

Output schema:
{
  "is_duplicate": <boolean>,
  "duplicate_issue_id": "<id or null>",
  "similarity_score": <float 0.0-1.0>,
  "confidence": <float 0.0-1.0>,
  "merge_recommended": <boolean>,
  "reasoning": "<one sentence>"
}"""


def duplicate_check_node(state: dict) -> dict:
    context = "\n".join(state["retrieved_docs"])
    user_msg = f"""New issue and existing issues data:
{json.dumps(state['input_data'], indent=2)}

Duplicate detection rules from knowledge base:
{context}
"""
    response = llm.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_msg)
    ])
    try:
        output = json.loads(response.content)
    except json.JSONDecodeError:
        output = {"error": "parse_failed", "raw": response.content}

    state["agent_output"] = output
    state["confidence"] = output.get("confidence", 0.0)
    return state
