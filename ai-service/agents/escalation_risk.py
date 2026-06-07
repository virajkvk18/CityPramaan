import json
import os
from langchain_groq import ChatGroq
from langchain.schema import SystemMessage, HumanMessage

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=os.getenv("GROQ_API_KEY_AGENTS"))

SYSTEM_PROMPT = """You are an escalation risk assessor for an Indian municipal issue resolution system.
Determine whether a civic issue requires escalation to higher authorities.

Respond ONLY with valid JSON — no markdown, no explanation, no preamble.

Output schema:
{
  "should_escalate": <boolean>,
  "urgency_score": <float 0.0-1.0>,
  "escalation_level": "ward_officer|zonal_engineer|municipal_commissioner|none",
  "escalation_reasons": ["<reason>", ...],
  "confidence": <float 0.0-1.0>,
  "recommended_action": "<one sentence>"
}"""


def escalation_risk_node(state: dict) -> dict:
    context = "\n".join(state["retrieved_docs"])
    user_msg = f"""Issue status and history data:
{json.dumps(state['input_data'], indent=2)}

Escalation rules from knowledge base:
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
