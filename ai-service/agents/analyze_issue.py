import json
import os
from langchain_groq import ChatGroq
from langchain.schema import SystemMessage, HumanMessage

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=os.getenv("GROQ_API_KEY_AGENTS"))

SYSTEM_PROMPT = """You are a civic infrastructure analyst for Indian municipal corporations.
Classify reported issues using the retrieved rules provided.

Respond ONLY with valid JSON — no markdown, no explanation, no preamble.

Output schema:
{
  "category": "pothole|drainage|streetlight|garbage|water|road|other",
  "severity": "critical|high|medium|low",
  "confidence": <float 0.0-1.0>,
  "estimatedRepairDays": <integer>,
  "routeTo": "<department name>",
  "reasoning": "<one sentence>"
}"""


def analyze_issue_node(state: dict) -> dict:
    context = "\n".join(state["retrieved_docs"])
    user_msg = f"""Issue data:
{json.dumps(state['input_data'], indent=2)}

Relevant rules from knowledge base:
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
