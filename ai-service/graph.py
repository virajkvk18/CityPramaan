import os
from typing import TypedDict, List
from dotenv import load_dotenv
load_dotenv()

from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_chroma import Chroma

from rag.vectorstore import get_vectorstore
from agents.analyze_issue import analyze_issue_node
from agents.repair_audit import repair_audit_node
from agents.contractor_match import contractor_match_node
from agents.public_summary import public_summary_node
from agents.warranty_risk import warranty_risk_node
from agents.duplicate_check import duplicate_check_node
from agents.escalation_risk import escalation_risk_node


class AgentState(TypedDict):
    endpoint: str           # which agent to invoke
    input_data: dict        # raw request payload from Node
    retrieved_docs: List[str]  # top-k chunks from ChromaDB
    agent_output: dict      # final structured JSON result
    confidence: float


def retrieve_docs(state: AgentState) -> AgentState:
    """Semantic retrieval node — runs before every agent."""
    query = str(state["input_data"])
    vectorstore = get_vectorstore()

    # Filter by agent if metadata exists
    agent_name = state["endpoint"]
    try:
        docs = vectorstore.similarity_search(
            query, k=5,
            filter={"agent": agent_name}
        )
        # Fallback: if filtered results are sparse, widen the search
        if len(docs) < 2:
            docs = vectorstore.similarity_search(query, k=5)
    except Exception:
        docs = vectorstore.similarity_search(query, k=5)

    state["retrieved_docs"] = [d.page_content for d in docs]
    return state


def route_agent(state: AgentState) -> str:
    """Conditional edge: routes to the correct agent node."""
    return state["endpoint"]


def build_graph():
    graph = StateGraph(AgentState)

    # Nodes
    graph.add_node("retrieve_docs",     retrieve_docs)
    graph.add_node("analyze_issue",     analyze_issue_node)
    graph.add_node("repair_audit",      repair_audit_node)
    graph.add_node("contractor_match",  contractor_match_node)
    graph.add_node("public_summary",    public_summary_node)
    graph.add_node("warranty_risk",     warranty_risk_node)
    graph.add_node("duplicate_check",   duplicate_check_node)
    graph.add_node("escalation_risk",   escalation_risk_node)

    # Entry
    graph.set_entry_point("retrieve_docs")

    # Route after retrieval
    graph.add_conditional_edges("retrieve_docs", route_agent, {
        "analyze_issue":    "analyze_issue",
        "repair_audit":     "repair_audit",
        "contractor_match": "contractor_match",
        "public_summary":   "public_summary",
        "warranty_risk":    "warranty_risk",
        "duplicate_check":  "duplicate_check",
        "escalation_risk":  "escalation_risk",
    })

    # All agents end the graph
    for node in [
        "analyze_issue", "repair_audit", "contractor_match",
        "public_summary", "warranty_risk", "duplicate_check", "escalation_risk"
    ]:
        graph.add_edge(node, END)

    return graph.compile()


# Singleton — imported by main.py
agent_graph = build_graph()
