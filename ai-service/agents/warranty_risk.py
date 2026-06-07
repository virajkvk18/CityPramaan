import json
import os
from langchain_groq import ChatGroq
from langchain.schema import SystemMessage, HumanMessage

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=os.getenv("GROQ_API_KEY_AGENTS"))

SYSTEM_PROMPT = """You are a warranty risk assessor for a municipal infrastructure authority.
Evaluate the warranty validity and risk for completed civic repairs.

Respond ONLY with valid JSON — no markdown, no explanation, no preamble.

Output schema:
{
  "warranty_valid": <boolean>,
  "risk_level": "low|medium|high|critical",
  "risk_score": <float 0.0-1.0>,
  "risk_factors": ["<factor>", ...],
  "warranty_expires_days": <integer or null>,
  "confidence": <float 0.0-1.0>,
  "reasoning": "<one sentence>"
}"""


def warranty_risk_node(state: dict) -> dict:
    context = "\n".join(state["retrieved_docs"])
    user_msg = f"""Repair and warranty data:
{json.dumps(state['input_data'], indent=2)}

Warranty rules from knowledge base:
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
