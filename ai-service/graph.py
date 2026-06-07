from typing import List, TypedDict

from dotenv import load_dotenv
from langgraph.graph import END, StateGraph

from agents.analyze_issue import analyze_issue_node
from agents.contractor_match import contractor_match_node
from agents.duplicate_check import duplicate_check_node
from agents.escalation_risk import escalation_risk_node
from agents.public_summary import public_summary_node
from agents.repair_audit import repair_audit_node
from agents.warranty_risk import warranty_risk_node
from rag.vectorstore import get_vectorstore

load_dotenv()


class AgentState(TypedDict):
    endpoint: str
    input_data: dict
    retrieved_docs: List[str]
    agent_output: dict
    confidence: float


def retrieve_docs(state: AgentState) -> AgentState:
    """Retrieve matching civic rules before routing to an agent."""
    query = str(state.get("input_data", {}))

    try:
        vectorstore = get_vectorstore()
        agent_name = state["endpoint"]

        try:
            docs = vectorstore.similarity_search(
                query,
                k=5,
                filter={"agent": agent_name},
            )
            if len(docs) < 2:
                docs = vectorstore.similarity_search(query, k=5)
        except Exception:
            docs = vectorstore.similarity_search(query, k=5)

        state["retrieved_docs"] = [doc.page_content for doc in docs]
    except Exception as error:
        state["retrieved_docs"] = [
            f"RAG retrieval unavailable: {error}. Use civic fallback rules and mark uncertainty."
        ]

    return state


def route_agent(state: AgentState) -> str:
    return state["endpoint"]


def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("retrieve_docs", retrieve_docs)
    graph.add_node("analyze_issue", analyze_issue_node)
    graph.add_node("repair_audit", repair_audit_node)
    graph.add_node("contractor_match", contractor_match_node)
    graph.add_node("public_summary", public_summary_node)
    graph.add_node("warranty_risk", warranty_risk_node)
    graph.add_node("duplicate_check", duplicate_check_node)
    graph.add_node("escalation_risk", escalation_risk_node)

    graph.set_entry_point("retrieve_docs")
    graph.add_conditional_edges(
        "retrieve_docs",
        route_agent,
        {
            "analyze_issue": "analyze_issue",
            "repair_audit": "repair_audit",
            "contractor_match": "contractor_match",
            "public_summary": "public_summary",
            "warranty_risk": "warranty_risk",
            "duplicate_check": "duplicate_check",
            "escalation_risk": "escalation_risk",
        },
    )

    for node in [
        "analyze_issue",
        "repair_audit",
        "contractor_match",
        "public_summary",
        "warranty_risk",
        "duplicate_check",
        "escalation_risk",
    ]:
        graph.add_edge(node, END)

    return graph.compile()


agent_graph = build_graph()
