import json
import os
from langchain_groq import ChatGroq
from langchain.schema import SystemMessage, HumanMessage

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=os.getenv("GROQ_API_KEY_AGENTS"))

SYSTEM_PROMPT = """You are a contractor procurement specialist for an Indian municipal corporation.
Match contractors to civic issues using the eligibility rules provided.

Respond ONLY with valid JSON — no markdown, no explanation, no preamble.

Output schema:
{
  "ranked_contractors": [
    {
      "contractor_id": "<id>",
      "match_score": <float 0.0-1.0>,
      "reasoning": "<one sentence>"
    }
  ],
  "confidence": <float 0.0-1.0>,
  "recommended_contractor_id": "<id>",
  "match_reasoning": "<one sentence>"
}"""


def contractor_match_node(state: dict) -> dict:
    context = "\n".join(state["retrieved_docs"])
    user_msg = f"""Issue and contractor data:
{json.dumps(state['input_data'], indent=2)}

Contractor eligibility rules from knowledge base:
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
