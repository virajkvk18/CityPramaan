import json
import os
import re
from functools import lru_cache
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq


def get_groq_api_key() -> str | None:
    return (
        os.getenv("CITYPRAMAAN_GROQ_API_KEY")
        or os.getenv("GROQ_API_KEY_AGENTS")
        or os.getenv("GROQ_API_KEY")
    )


def get_groq_model() -> str:
    return (
        os.getenv("CITYPRAMAAN_GROQ_MODEL")
        or os.getenv("GROQ_MODEL")
        or "llama-3.3-70b-versatile"
    )


@lru_cache(maxsize=1)
def get_llm() -> ChatGroq | None:
    api_key = get_groq_api_key()

    if not api_key:
        return None

    return ChatGroq(
        model=get_groq_model(),
        temperature=0,
        api_key=api_key,
    )


def docs_context(state: dict) -> str:
    docs = state.get("retrieved_docs") or []
    return "\n\n".join(str(doc) for doc in docs if doc)


def parse_json_object(content: str) -> dict[str, Any]:
    cleaned = content.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if not match:
            raise
        parsed = json.loads(match.group(0))

    return parsed if isinstance(parsed, dict) else {}


def run_json_agent(
    state: dict,
    system_prompt: str,
    input_label: str,
    fallback: dict[str, Any],
    confidence_key: str = "confidence",
) -> dict:
    llm = get_llm()

    if llm is None:
        output = {
            **fallback,
            "aiMode": "ruleset-fallback",
            "aiProvider": "local",
            "aiFallbackReason": (
                "No Groq key configured. Set CITYPRAMAAN_GROQ_API_KEY, "
                "GROQ_API_KEY_AGENTS, or GROQ_API_KEY."
            ),
        }
        state["agent_output"] = output
        state["confidence"] = float(output.get(confidence_key, 0) or 0)
        return state

    user_msg = f"""{input_label}:
{json.dumps(state.get("input_data", {}), indent=2)}

Relevant retrieved civic RAG rules:
{docs_context(state) or "No retrieved rules were available. Use general Indian civic workflow judgment."}
"""

    try:
        response = llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_msg),
            ]
        )
        output = parse_json_object(str(response.content))
        output["aiMode"] = "real-ai"
        output["aiProvider"] = "Groq"
        output["aiModel"] = get_groq_model()
    except Exception as error:
        output = {
            **fallback,
            "aiMode": "ruleset-fallback",
            "aiProvider": "Groq",
            "aiFallbackReason": str(error),
        }

    state["agent_output"] = output
    state["confidence"] = float(output.get(confidence_key, 0) or 0)
    return state
