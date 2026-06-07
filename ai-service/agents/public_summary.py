import json
import os
from langchain_groq import ChatGroq
from langchain.schema import SystemMessage, HumanMessage

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=os.getenv("GROQ_API_KEY_AGENTS"))

SYSTEM_PROMPT = """You are a civic communications officer for an Indian municipal corporation.
Write clear, simple public-facing summaries about civic issue resolutions.

Guidelines:
- Use simple language (Grade 8 reading level)
- Avoid technical jargon
- Be factual and reassuring
- Include timeline and next steps

Respond ONLY with valid JSON — no markdown, no explanation, no preamble.

Output schema:
{
  "summary": "<2-3 sentence plain English summary>",
  "citizen_message": "<direct message to the citizen who reported>",
  "status_label": "reported|in_progress|resolved|escalated",
  "timeline": "<estimated resolution e.g. '3-5 business days'>",
  "confidence": <float 0.0-1.0>
}"""


def public_summary_node(state: dict) -> dict:
    context = "\n".join(state["retrieved_docs"])
    user_msg = f"""Issue data:
{json.dumps(state['input_data'], indent=2)}

Communication guidelines from knowledge base:
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
