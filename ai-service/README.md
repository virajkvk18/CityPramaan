# CityPramaan AI Agent Service

FastAPI service for CityPramaan's AI + RAG backend.

It uses:

- Groq for real LLM responses
- LangGraph for agent routing
- ChromaDB for civic-rule RAG retrieval
- SentenceTransformers embeddings for local vector search

## Agents

| Endpoint | Agent |
| --- | --- |
| `POST /analyze-issue` | Issue Analysis Agent |
| `POST /repair-audit` | Repair Audit Agent |
| `POST /contractor-match` | Contractor Matching Agent |
| `POST /public-summary` | Civic Public Summary Agent |
| `POST /warranty-risk` | Warranty Risk Agent |
| `POST /duplicate-check` | Duplicate Complaint Agent |
| `POST /escalation-risk` | Critical Escalation Agent |

Each endpoint accepts either:

```json
{ "data": { "description": "large pothole near school", "city": "Bhopal" } }
```

or a direct JSON object:

```json
{ "description": "large pothole near school", "city": "Bhopal" }
```

## Local Setup

Run these commands from the repo root:

```powershell
cd C:\Users\Asus\OneDrive\Desktop\Projects\CityPramaan\ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Open `.env` and add your Groq key:

```env
CITYPRAMAAN_GROQ_API_KEY=gsk_your_real_key
CITYPRAMAAN_GROQ_MODEL=llama-3.3-70b-versatile
CHROMA_DB_PATH=./chroma_db
PORT=8000
```

Seed the RAG knowledge base once:

```powershell
python rag/ingest.py
```

Start the service:

```powershell
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Test it:

```powershell
Invoke-RestMethod -Uri http://localhost:8000/health

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8000/analyze-issue `
  -ContentType "application/json" `
  -Body '{"data":{"description":"large pothole near school gate","cityName":"Bhopal","location":"MP Nagar"}}'
```

## Deploy On Render

Use Render for this folder if you want the Python LangGraph + ChromaDB service online.

Render settings:

- Service type: Web Service
- Root directory: `ai-service`
- Build command: `pip install -r requirements.txt`
- Start command: `python rag/ingest.py && uvicorn main:app --host 0.0.0.0 --port $PORT`
- Python runtime: `python-3.11.9` from `runtime.txt`

Environment variables on Render:

```env
CITYPRAMAAN_GROQ_API_KEY=your_groq_key
CITYPRAMAAN_GROQ_MODEL=llama-3.3-70b-versatile
CHROMA_DB_PATH=./chroma_db
CORS_ORIGINS=https://your-vercel-domain.vercel.app,http://localhost:3000
```

## Vercel Or Render?

Your Next.js app already has AI routes under `web/app/api/ai/*`. Those can call Groq directly on Vercel if you add this Vercel env variable:

```env
CITYPRAMAAN_GROQ_API_KEY=your_groq_key
```

For the heavier Python RAG service in this folder, deploy on Render/Railway/Fly. Vercel is not the right host for a long-running Python FastAPI service with ChromaDB and model embeddings.

Recommended demo setup:

1. Vercel hosts the CityPramaan website.
2. Render hosts `ai-service`.
3. Vercel has `AI_SERVICE_URL=https://your-render-service.onrender.com` if the frontend is wired to call this service.
4. Vercel still keeps `CITYPRAMAAN_GROQ_API_KEY` as direct fallback.
