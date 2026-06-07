"""
Run once to seed ChromaDB from your civic-rag-rules.ts and civic-rag-documents.ts content.
Usage: python rag/ingest.py
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter

# -----------------------------------------------------------------------
# Paste content from your civic-rag-rules.ts and civic-rag-documents.ts
# Add as many entries as needed — one dict per rule/document section
# -----------------------------------------------------------------------
CIVIC_DOCS = [
    # --- ISSUE ANALYSIS RULES ---
    {
        "text": "Potholes with depth greater than 6 inches are classified as critical severity. Repair SLA: 48 hours. Route to Roads & Infrastructure Department.",
        "metadata": {"category": "pothole", "type": "rule", "agent": "analyze_issue"}
    },
    {
        "text": "Streetlight failures in high-traffic zones or near hospitals/schools escalate to high severity after 24 hours unreported. Route to Electrical Department.",
        "metadata": {"category": "streetlight", "type": "rule", "agent": "analyze_issue"}
    },
    {
        "text": "Drainage blockages causing waterlogging are high severity. During monsoon season, severity upgrades to critical. Route to Drainage & Sanitation Department.",
        "metadata": {"category": "drainage", "type": "rule", "agent": "analyze_issue"}
    },
    {
        "text": "Garbage overflow unreported for more than 48 hours in residential zones is medium severity. Route to Solid Waste Management Department.",
        "metadata": {"category": "garbage", "type": "rule", "agent": "analyze_issue"}
    },
    {
        "text": "Water pipe leakages wasting more than 100 litres per day are high severity. Contaminated water supply is critical. Route to Water Supply Department.",
        "metadata": {"category": "water", "type": "rule", "agent": "analyze_issue"}
    },

    # --- CONTRACTOR MATCH RULES ---
    {
        "text": "Contractor eligibility criteria: proximity within 5km of issue location, minimum rating of 4.0 out of 5, active municipal license, no pending disciplinary action.",
        "metadata": {"category": "contractor", "type": "rule", "agent": "contractor_match"}
    },
    {
        "text": "For critical severity issues, only contractors with at least 3 years experience in the relevant category and a completion rate above 90% should be matched.",
        "metadata": {"category": "contractor", "type": "rule", "agent": "contractor_match"}
    },
    {
        "text": "Contractor match scoring: 40% location proximity, 30% past performance rating, 20% category specialization, 10% current workload availability.",
        "metadata": {"category": "contractor", "type": "rule", "agent": "contractor_match"}
    },

    # --- REPAIR AUDIT RULES ---
    {
        "text": "Repair quality audit checklist: photographic before/after evidence required, material grade must match specification, surface levelling within 2mm tolerance for roads.",
        "metadata": {"category": "repair", "type": "rule", "agent": "repair_audit"}
    },
    {
        "text": "A repair audit passes if: evidence photos are submitted within 6 hours of completion, GPS coordinates match within 50 metres of reported issue, and quality score is above 7/10.",
        "metadata": {"category": "repair", "type": "rule", "agent": "repair_audit"}
    },
    {
        "text": "Common repair defects: inadequate compaction of base layer, use of substandard bitumen mix, incomplete patch edges leading to future cracking.",
        "metadata": {"category": "repair", "type": "document", "agent": "repair_audit"}
    },

    # --- WARRANTY RISK RULES ---
    {
        "text": "Standard warranty period for road repairs: 2 years. Warranty is void if: repair was done during monsoon without proper waterproofing, or if base layer was not replaced.",
        "metadata": {"category": "warranty", "type": "rule", "agent": "warranty_risk"}
    },
    {
        "text": "High warranty risk indicators: repair done during extreme weather, contractor had previous warranty claims, issue recurred within 30 days of last repair at same location.",
        "metadata": {"category": "warranty", "type": "rule", "agent": "warranty_risk"}
    },
    {
        "text": "Warranty claim process: citizen submits photographic evidence of recurrence, municipal inspector verifies within 7 days, contractor must redo repair at no additional cost.",
        "metadata": {"category": "warranty", "type": "rule", "agent": "warranty_risk"}
    },

    # --- ESCALATION RISK RULES ---
    {
        "text": "Escalate an issue automatically if: unresolved for more than 2x the standard SLA, has received more than 10 upvotes from citizens, or involves risk to public safety.",
        "metadata": {"category": "escalation", "type": "rule", "agent": "escalation_risk"}
    },
    {
        "text": "Escalation triggers: issue reported near school/hospital, issue causing road accidents, issue overlaps with upcoming public event in the area.",
        "metadata": {"category": "escalation", "type": "rule", "agent": "escalation_risk"}
    },
    {
        "text": "Escalation path: Ward Officer -> Zonal Engineer -> Municipal Commissioner. Each level has 24 hours to respond before further escalation.",
        "metadata": {"category": "escalation", "type": "rule", "agent": "escalation_risk"}
    },

    # --- DUPLICATE CHECK RULES ---
    {
        "text": "An issue is considered a duplicate if: another open issue exists within 30 metres of the same GPS coordinates, with the same category, reported within the last 30 days.",
        "metadata": {"category": "duplicate", "type": "rule", "agent": "duplicate_check"}
    },
    {
        "text": "Duplicate threshold: similarity score above 0.85 based on location + category + description embedding similarity. Merge duplicates and notify all reporters.",
        "metadata": {"category": "duplicate", "type": "rule", "agent": "duplicate_check"}
    },

    # --- PUBLIC SUMMARY RULES ---
    {
        "text": "Public summaries must be written in simple language (Grade 8 reading level), avoid technical jargon, include estimated resolution date, and be available in English and Hindi.",
        "metadata": {"category": "public_comms", "type": "rule", "agent": "public_summary"}
    },
    {
        "text": "Public summary must include: current status of issue, what action is being taken, expected resolution timeline, and contact information for follow-up queries.",
        "metadata": {"category": "public_comms", "type": "rule", "agent": "public_summary"}
    },
]


def build_vectorstore():
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    texts, metadatas = [], []

    for doc in CIVIC_DOCS:
        chunks = splitter.split_text(doc["text"])
        texts.extend(chunks)
        metadatas.extend([doc["metadata"]] * len(chunks))

    print(f"Ingesting {len(texts)} chunks into ChromaDB...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vectorstore = Chroma.from_texts(
        texts=texts,
        embedding=embeddings,
        metadatas=metadatas,
        persist_directory=os.getenv("CHROMA_DB_PATH", "./chroma_db")
    )
    vectorstore.persist()
    print(f"Done. ChromaDB seeded at {os.getenv('CHROMA_DB_PATH', './chroma_db')}")


if __name__ == "__main__":
    build_vectorstore()
