import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from graph import agent_graph

app = FastAPI(
    title="CityPramaan AI Agent Service",
    description="LangGraph-powered agentic RAG for civic issue management",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AgentRequest(BaseModel):
    data: dict


def invoke_agent(endpoint: str, data: dict) -> dict:
    """Shared invocation helper for all agents."""
    try:
        result = agent_graph.invoke({
            "endpoint": endpoint,
            "input_data": data,
            "retrieved_docs": [],
            "agent_output": {},
            "confidence": 0.0
        })
        return result["agent_output"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "service": "CityPramaan AI Agent Service"}


@app.post("/analyze-issue")
async def analyze_issue(req: AgentRequest):
    """Classify issue category, severity, department routing, and repair estimate."""
    return invoke_agent("analyze_issue", req.data)


@app.post("/repair-audit")
async def repair_audit(req: AgentRequest):
    """Audit submitted repair quality against municipal standards."""
    return invoke_agent("repair_audit", req.data)


@app.post("/contractor-match")
async def contractor_match(req: AgentRequest):
    """Match and rank eligible contractors for a given issue."""
    return invoke_agent("contractor_match", req.data)


@app.post("/public-summary")
async def public_summary(req: AgentRequest):
    """Generate citizen-facing summary of an issue and its resolution."""
    return invoke_agent("public_summary", req.data)


@app.post("/warranty-risk")
async def warranty_risk(req: AgentRequest):
    """Assess warranty validity and risk for a completed repair."""
    return invoke_agent("warranty_risk", req.data)


@app.post("/duplicate-check")
async def duplicate_check(req: AgentRequest):
    """Detect if an incoming issue duplicates an existing open report."""
    return invoke_agent("duplicate_check", req.data)


@app.post("/escalation-risk")
async def escalation_risk(req: AgentRequest):
    """Determine if and to whom an issue should be escalated."""
    return invoke_agent("escalation_risk", req.data)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
