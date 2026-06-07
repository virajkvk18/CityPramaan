# CityPramaan — AI Agent Service

LangGraph + ChromaDB agentic RAG service powering all 7 AI endpoints.

## Structure

```
ai-service/
├── main.py              # FastAPI — 7 POST endpoints
├── graph.py             # LangGraph StateGraph — retrieval + routing
├── agents/
│   ├── analyze_issue.py
│   ├── repair_audit.py
│   ├── contractor_match.py
│   ├── public_summary.py
│   ├── warranty_risk.py
│   ├── duplicate_check.py
│   └── escalation_risk.py
├── rag/
│   ├── ingest.py        # Seed ChromaDB (run once)
│   └── vectorstore.py   # Singleton Chroma client
├── node_proxy.ts        # Drop into your ai-agent-server.ts
├── requirements.txt
└── .env.example
```

## Setup

```bash
# 1. Create virtualenv
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy and fill env
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 4. Seed ChromaDB (once)
#    First: paste your civic-rag-rules.ts and civic-rag-documents.ts
#    content into CIVIC_DOCS in rag/ingest.py, then:
python rag/ingest.py

# 5. Start the service
uvicorn main:app --reload --port 8000
```

## Node.js Integration

Add to your existing `.env` in `web/`:
```
AI_SERVICE_URL=http://localhost:8000
```

Copy `node_proxy.ts` into `web/src/lib/` and import:
```ts
import { analyzeIssue, contractorMatch, ... } from "./node_proxy";
```

## Endpoints

| Method | Path | Agent |
|--------|------|-------|
| POST | `/analyze-issue` | Issue classifier |
| POST | `/repair-audit` | Quality auditor |
| POST | `/contractor-match` | Contractor ranker |
| POST | `/public-summary` | Citizen communicator |
| POST | `/warranty-risk` | Warranty assessor |
| POST | `/duplicate-check` | Duplicate detector |
| POST | `/escalation-risk` | Escalation decider |

All endpoints accept `{ "data": { ...your payload } }` and return structured JSON.

## LangGraph Flow

```
Request → retrieve_docs (ChromaDB) → [route by endpoint] → agent node (GPT-4o) → JSON response
```

## Adding More Docs to ChromaDB

Edit `CIVIC_DOCS` in `rag/ingest.py` and re-run:
```bash
python rag/ingest.py
```

## Fine-tuning (future)

Log every `agent_output` to Firestore. After ~300 examples per agent, export as JSONL and run:
```bash
openai api fine_tunes.create -t data.jsonl -m gpt-4o-mini
```
Then swap `model="gpt-4o"` in each agent file to your fine-tuned model ID.
