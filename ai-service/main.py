import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.common import get_groq_api_key, get_groq_model
from graph import agent_graph

load_dotenv()

app = FastAPI(
    title="CityPramaan AI Agent Service",
    description="Groq + LangGraph + ChromaDB RAG service for civic decision support",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


class AgentRequest(BaseModel):
    data: dict[str, Any] = {}


def invoke_agent(endpoint: str, data: dict[str, Any]) -> dict[str, Any]:
    try:
        result = agent_graph.invoke(
            {
                "endpoint": endpoint,
                "input_data": data,
                "retrieved_docs": [],
                "agent_output": {},
                "confidence": 0.0,
            }
        )
        return result.get("agent_output", {})
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


async def read_agent_request(request: Request) -> dict[str, Any]:
    payload = await request.json()

    if isinstance(payload, dict) and isinstance(payload.get("data"), dict):
        return payload["data"]

    if isinstance(payload, dict):
        return payload

    raise HTTPException(status_code=400, detail="Request body must be a JSON object.")


@app.get("/")
async def root():
    return await health()


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "CityPramaan AI Agent Service",
        "groqConfigured": bool(get_groq_api_key()),
        "groqModel": get_groq_model(),
        "chromaPath": os.getenv("CHROMA_DB_PATH", "./chroma_db"),
    }


@app.post("/analyze-issue")
async def analyze_issue(request: Request):
    return invoke_agent("analyze_issue", await read_agent_request(request))


@app.post("/repair-audit")
async def repair_audit(request: Request):
    return invoke_agent("repair_audit", await read_agent_request(request))


@app.post("/contractor-match")
async def contractor_match(request: Request):
    return invoke_agent("contractor_match", await read_agent_request(request))


@app.post("/public-summary")
async def public_summary(request: Request):
    return invoke_agent("public_summary", await read_agent_request(request))


@app.post("/warranty-risk")
async def warranty_risk(request: Request):
    return invoke_agent("warranty_risk", await read_agent_request(request))


@app.post("/duplicate-check")
async def duplicate_check(request: Request):
    return invoke_agent("duplicate_check", await read_agent_request(request))


@app.post("/escalation-risk")
async def escalation_risk(request: Request):
    return invoke_agent("escalation_risk", await read_agent_request(request))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )
