<div align="center">

![Header](https://capsule-render.vercel.app/api?type=waving&color=0:ff9933,50:00dbe9,100:00eb88&height=210&section=header&text=CityPramaan&fontSize=72&fontColor=ffffff&fontAlignY=38&desc=Proof%20of%20Repair%20for%20Accountable%20Cities&descAlignY=58&descSize=20&animation=fadeIn)

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=21&duration=3000&pause=900&color=00DBE9&center=true&vCenter=true&width=900&lines=AI-powered+civic+issue+reporting;Real+GPS+and+camera-based+public+evidence;Blockchain-style+proof+timeline+and+repair+warranty;Transparent+repair+history+for+accountable+cities)](https://git.io/typing-svg)

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind_CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel)](https://city-pramaan.vercel.app)

<br />

[![Status](https://img.shields.io/badge/Status-Live_MVP-00eb88?style=flat-square&labelColor=0b1120)](#current-status)
[![Track](https://img.shields.io/badge/Track-Smart_Cities_%2F_Web3_%2F_AI-00dbe9?style=flat-square&labelColor=0b1120)](#)
[![GitHub Stars](https://img.shields.io/github/stars/virajkvk18/CityPramaan?style=flat-square&color=ff9933&labelColor=0b1120)](https://github.com/virajkvk18/CityPramaan/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/virajkvk18/CityPramaan?style=flat-square&color=00dbe9&labelColor=0b1120)](https://github.com/virajkvk18/CityPramaan/forks)

<br />

> **CityPramaan** is an AI + Web3 civic accountability platform where a public infrastructure issue is not only reported, but verified, repaired, approved, warrantied, and permanently visible as public proof.

<br />

[<img src="https://img.shields.io/badge/🚀%20Live%20Demo-city--pramaan.vercel.app-00eb88?style=for-the-badge&labelColor=0b1120" />](https://city-pramaan.vercel.app)
&nbsp;
[<img src="https://img.shields.io/badge/🐛%20Report%20Bug-GitHub%20Issues-ff4444?style=for-the-badge&labelColor=0b1120" />](https://github.com/virajkvk18/CityPramaan/issues)
&nbsp;
[<img src="https://img.shields.io/badge/✨%20Request%20Feature-GitHub%20Issues-00dbe9?style=for-the-badge&labelColor=0b1120" />](https://github.com/virajkvk18/CityPramaan/issues)

</div>

---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [Why CityPramaan Is Different](#why-citypramaan-is-different)
- [Current Status](#current-status)
- [End-to-End Workflow](#end-to-end-workflow)
- [Platform Modules](#platform-modules)
- [AI and Web3 Role](#ai-and-web3-role)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Demo Flow](#demo-flow)
- [Roadmap](#roadmap)
- [Getting Started](#getting-started)
- [Repository Structure](#repository-structure)
- [Author](#author)

---

## Problem

Most civic complaint systems stop at a weak and opaque workflow:

```text
Citizen reports issue  --->  Admin marks closed
```

The real problem is what happens between those two steps.

| Gap in existing systems | Real impact |
| --- | --- |
| No public repair proof | Citizens cannot verify whether work actually happened |
| Fake or weak closure | Issues can be marked solved without visible evidence |
| No contractor accountability | Poor repair quality is not linked to the contractor |
| No warranty memory | The same pothole, drain, or outage can repeat without a penalty trail |
| No public audit history | Citizens cannot inspect old photos, repair proof, or status updates |
| No clear restoration ETA | During power outages or storm damage, citizens do not know progress or expected restoration time |

Cities do not only need complaint tracking. They need **proof of resolution**.

---

## Solution

**CityPramaan** creates a connected proof lifecycle for civic infrastructure issues.

```text
Citizen Report
   -> AI Issue Analysis
   -> Evidence Hash / Proof Record
   -> Contractor or Utility Crew Action
   -> Repair / Restoration Proof Upload
   -> Pending Issuer Approval
   -> Warranty or Restoration Monitoring
   -> Public Proof Timeline
   -> Closure or Under-Warranty Reopen
```

Citizens can report road damage, drainage blockage, garbage blackspots, streetlight dark zones, water leakage, footpath blockage, transformer outage, feeder fault, and weather-linked power failures. Contractors or utility crews upload after-repair proof. The report issuer approves the proof. Warranty or restoration monitoring activates. The public can verify the complete history.

> Every public repair should have a public proof trail.

---

## Why CityPramaan Is Different

| Normal complaint app | CityPramaan |
| --- | --- |
| Focuses on reporting | Focuses on verified resolution |
| Closed status can be opaque | Every status change appears in a public proof timeline |
| Repair images may stay hidden | Before/after evidence is visible to the public |
| No warranty tracking | Warranty scanner tracks repeat failures |
| No contractor memory | Contractor proof and repair quality stay linked to the issue |
| Closed issue disappears | Closed issue stays in public history |
| Public cannot verify progress | Public can inspect location, proof, status, feedback, and history |
| Location is often manually vague | Real browser GPS and map coordinates are stored with reports |

---

## Current Status

The platform is **live at [city-pramaan.vercel.app](https://city-pramaan.vercel.app)** — a functional Next.js + Node.js MVP with a deployed AI microservice, Supabase-backed persistence, and email OTP authentication.

### ✅ Working Now

**Authentication & Users**
- Email OTP signup and login flow (Nodemailer + Gmail + Firestore OTP store with expiry)
- Firebase Auth integration with secure session handling
- Rate-limited OTP requests with server-side expiry enforcement

**Core Platform**
- Command Center dashboard with civic issue map
- Automatic browser location permission and city detection
- City selector synced globally across pages
- Real GPS coordinates saved with reports
- Google Maps / OpenStreetMap location previews
- Mobile camera capture for live issue photos and gallery upload
- Citizen report creation with AI-powered issue analysis
- Proof creation and wallet-style signing modal
- New reports sync to Command Center, Contractor View, Pending Proof, Warranty Scanner, and Public Proof
- Contractor dashboard with exact issue selection and after-repair proof upload
- Pending Approval page for issuer review
- Warranty Scanner / Urban Ledger with city-wise repair history
- Public Proof page — before/after images, AI verdict, location, proof hash, transaction hash, timeline, warranty status, public feedback
- Under-warranty repeat issue flow
- Power outage / transformer failure flow with ETA, department, restoration stage, and citizen updates
- Notifications panel linking users to issue progress
- Multilingual UI foundation (English + major Indian regional languages)
- Dark/bright theme toggle
- Mobile-first responsive layout

**AI Microservice (Deployed on Render)**
- Standalone `ai-service/` — FastAPI + LangGraph StateGraph + ChromaDB + Groq LLM
- 7 live AI endpoints routed through a shared LangGraph agent graph:
  - `POST /analyze-issue` — issue type detection, severity, SLA, confidence score
  - `POST /repair-audit` — before/after repair quality comparison
  - `POST /contractor-match` — matches issue to suitable contractor profiles
  - `POST /public-summary` — citizen-readable plain-language issue summary
  - `POST /warranty-risk` — predicts repeat failure probability
  - `POST /duplicate-check` — detects near-duplicate reports by location + type
  - `POST /escalation-risk` — flags issues at risk of SLA breach
- HuggingFace embeddings (`all-MiniLM-L6-v2`) for semantic similarity
- Isolated `GROQ_API_KEY_AGENTS` env var; LangChain v0.2+ compatible imports throughout

### 🗄️ Data Layer

| Store | Purpose |
| --- | --- |
| Firebase / Firestore | Auth, OTP storage with expiry, user profiles |
| Supabase PostgreSQL | Persistent civic reports, contractor records, repair proofs |
| Browser `localStorage` | MVP-mode fallback for demo without backend |
| Browser GPS | Live location detection and reverse geocoding |

---

## End-to-End Workflow

```mermaid
flowchart LR
    A["Citizen captures issue photo"] --> B["GPS city + coordinates detected"]
    B --> C["AI analyzes issue type, severity, SLA, confidence"]
    C --> D["Citizen signs and creates proof record"]
    D --> E["Issue appears on Command Center map"]
    E --> F["Contractor selects exact issue"]
    F --> G["Contractor uploads after-repair proof"]
    G --> H["Pending Approval page"]
    H --> I["Issuer approves repair proof"]
    I --> J["Warranty activates"]
    J --> K["Public Proof timeline updates"]
    K --> L{"Issue solved?"}
    L -->|Yes| M["Issue closed and moved to public history"]
    L -->|No / repeats| N["Public raises under-warranty repeat issue"]
    N --> E
```

---

## Platform Modules

### 1. Command Center

The main city operations dashboard.

- Shows active civic issues on a map
- Uses detected city context when location permission is allowed
- Displays issue status, severity, AI confidence, SLA, and warranty state
- Opens full issue details from map pins
- Removes closed issues from the active map

### 2. Report Issue

Citizen-facing issue creation flow.

- Requests real browser location permission
- Auto-detects city and coordinates
- Supports live camera capture on mobile
- Supports gallery upload
- Runs AI-powered infrastructure analysis via `/analyze-issue`
- Creates a blockchain-style proof record
- Syncs the report across the platform

### 3. Contractor View

Repair execution dashboard.

- Shows the latest reported issues
- Contractor selects the exact issue to repair
- Displays citizen issue image and exact location proof
- Uploads after-repair image
- Sends proof through AI repair audit via `/repair-audit`
- Sends proof for issuer approval

### 4. Pending Approval

Issuer review workflow.

- Shows reports waiting for approval
- Displays before image and contractor after image
- Shows repair quality signals from AI audit
- Lets issuer approve repair proof
- Moves approved issues into warranty state

### 5. Warranty Scanner

Public repair warranty registry.

- Shows city-wise public issue history
- Displays pending, active, closed, and repeat failure cases
- Shows before/after proof
- Shows map location and timeline
- Supports public feedback and under-warranty repeat issue flow

### 6. Public Proof Page

The hero demo page for each issue.

- Before image
- After image
- AI verdict
- Location and coordinates
- Blockchain evidence hash
- Transaction hash
- Proof timeline
- Warranty status
- Public feedback
- Issue closure status
- City report history

---

## AI and Web3 Role

### AI Layer

The deployed AI microservice (`ai-service/`) runs on Render as a standalone FastAPI service. It uses a **LangGraph StateGraph** to route all 7 endpoints through a shared agentic graph, with **ChromaDB** for semantic vector storage and **Groq (`ChatGroq`)** as the LLM backend. HuggingFace `all-MiniLM-L6-v2` embeddings power similarity and duplicate detection.

In production, AI is used for:

- Detecting issue category and severity from uploaded image
- Generating a citizen-readable civic issue summary
- Comparing before and after repair images for quality signals
- Predicting warranty breach and repeat failure risk
- Flagging near-duplicate reports to prevent spam
- Escalation risk scoring for SLA-breach prevention
- Matching issues to contractor capability profiles

### Blockchain / Web3 Layer

In the current MVP, wallet and proof signing are demonstrated through a mock Web3 flow. In production, blockchain will be used for:

- Storing citizen evidence hash on-chain
- Storing contractor repair proof hash
- Recording timestamped status transitions
- Creating tamper-resistant public proof timelines
- Linking warranty activation and repeat failures to the same issue ID
- Making civic repair history transparent and manipulation-resistant

### Why Wallet?

The wallet represents identity and signing authority.

- Citizen wallet signs report creation
- Contractor wallet signs repair proof submission
- Issuer/admin wallet signs approval and warranty activation
- Public can verify that actions came from accountable participants

---

## Architecture

```mermaid
graph TD
    Citizen["Citizen"] --> Auth["Email OTP Auth\nFirebase + Nodemailer"]
    Auth --> Report["Report Issue Page"]
    Report --> GPS["Browser GPS + Reverse Geocoding"]
    Report --> Camera["Camera / Gallery Evidence"]
    Report --> AI["AI Microservice\nFastAPI + LangGraph + Groq"]
    AI --> Proof["Proof Creation Flow"]
    Proof --> DB["Supabase PostgreSQL\n+ Firestore"]
    DB --> Command["Command Center Map"]
    DB --> Contractor["Contractor View"]
    Contractor --> Repair["Repair Proof Upload"]
    Repair --> AI
    Repair --> Pending["Pending Approval"]
    Pending --> Warranty["Warranty Scanner"]
    Warranty --> Public["Public Proof Page"]
    Public --> Feedback["Public Feedback / Closure / Reopen"]
    Feedback --> DB

    Proof -. "Planned" .-> Chain["Smart Contract\nPolygon / Base"]
    Camera -. "Planned" .-> IPFS["IPFS Evidence Storage"]
    Repair -. "Planned" .-> IPFS
    Chain -. "Planned" .-> Public
    IPFS -. "Planned" .-> Public
```

---

## Tech Stack

### Current Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS, custom glassmorphism UI, dark purple/cyan design system, responsive layouts |
| Icons | Lucide React |
| Maps | OpenStreetMap embed, Google Maps links, GPS coordinates |
| Location | Browser Geolocation API, reverse geocoding |
| Media | Camera capture, gallery upload, browser-side image compression |
| Auth | Firebase Auth, Firestore OTP store, Nodemailer (Gmail SMTP) |
| Backend | Node.js + Express (Render), Supabase PostgreSQL |
| AI Service | FastAPI + LangGraph StateGraph + ChromaDB + Groq (`ChatGroq`) + HuggingFace Embeddings |
| State | Supabase + Firestore + browser localStorage fallback |
| Deployment | Vercel (frontend), Render (Node backend + AI microservice) |

### Planned Production Integrations

| Layer | Suggested Tooling |
| --- | --- |
| Smart contracts | Solidity, Hardhat, OpenZeppelin |
| Testnet | Polygon Amoy or Base Sepolia |
| Wallet | wagmi, RainbowKit, MetaMask |
| Evidence storage | IPFS / Pinata |
| AI vision | Gemini Vision / open-source classifier fine-tuned on civic images |

---

## Demo Flow

Use this sequence during a pitch/demo:

1. Open the **[Live Demo](https://city-pramaan.vercel.app)** and allow location permission.
2. Sign up or log in using the **Email OTP** flow.
3. Show that the **Command Center** city updates from browser GPS.
4. Create a new report from **Report Issue** using camera capture and GPS — watch the AI analysis run.
5. Return to the **Command Center** and show the report on the active map.
6. Open **Contractor View**, select the exact issue, and upload after-repair proof.
7. Open **Pending Approval** and approve the contractor proof.
8. Open **Warranty Scanner** and show warranty activation.
9. Open the **Public Proof** page — before/after images, AI result, hash, transaction, timeline, warranty, and feedback.
10. Add public feedback or raise an under-warranty repeat issue.
11. Close the issue and show that it leaves the active map but remains in public history.

---

## Roadmap

- [ ] Real smart contract deployment for report creation, repair proof, approval, warranty, and repeat failure events
- [ ] IPFS upload for citizen and contractor images
- [ ] AI vision model fine-tuned on civic infrastructure images (potholes, drainage, garbage, streetlights)
- [ ] Wallet-based roles for citizen, contractor, issuer, and public verifier
- [ ] Contractor reputation scoring
- [ ] Ward-level repair quality analytics dashboard
- [ ] Admin dashboard for municipal teams
- [ ] WhatsApp / mobile-first reporting interface
- [ ] Real-time WebSocket notification system
- [ ] Open civic data API for city performance metrics

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Python 3.10+ (for AI microservice)

### Clone

```bash
git clone https://github.com/virajkvk18/CityPramaan.git
cd CityPramaan
```

### Frontend

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`

Add the following to `web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
# ... see .env.example for full list
```

Run the SQL migration files in `web/supabase/migrations` inside the Supabase SQL editor to set up the database schema.

### AI Microservice

```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env
# Add GROQ_API_KEY_AGENTS to .env
uvicorn main:app --reload --port 8000
```

### Production Build

```bash
cd web
npm run lint
npm run build
```

---

## Repository Structure

```text
CityPramaan/
  ai-service/               ← FastAPI + LangGraph + ChromaDB + Groq AI microservice
    agents/                 ← 7 LangGraph agent files (analyze, audit, match, summary, warranty, duplicate, escalation)
    main.py
    requirements.txt
    .env.example
  contracts/
    .gitkeep                ← Smart contract placeholder (Solidity planned)
  docs/
  web/                      ← Next.js 16 frontend
    app/
      about/
      contractor/
      pending/
      proof/[id]/
      report/
      warranty/
      page.tsx
      layout.tsx
      globals.css
    src/
      components/
        layout/
        map/
        proof/
      lib/
        city-context.ts
        city-storage.ts
        detected-location-storage.ts
        infrastructure-analyzer.ts
        language-context.ts
        mock-data.ts
        report-storage.ts
        use-detected-location.ts
        wallet-storage.ts
    supabase/
      migrations/           ← SQL schema files
    public/
    package.json
    tsconfig.json
  README.md
```

---

## Project Pitch

**CityPramaan is not just a complaint app.** It is a proof-of-repair network for cities.

It solves the accountability gap after a civic issue is reported by making every important step visible, AI-verified, and permanently auditable:

```text
Report -> AI Verify -> Proof -> Repair -> Approval -> Warranty -> Public History
```

This makes it useful for citizens, contractors, issuers, city officials, and the general public.

---

## Author

<div align="center">

**Viraj Kumar Vishwakarma**

[![GitHub](https://img.shields.io/badge/GitHub-virajkvk18-181717?style=for-the-badge&logo=github)](https://github.com/virajkvk18)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-viraj--kumar--vishwakarma-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/viraj-kumar-vishwakarma)

Building civic-tech, AI, and Web3 solutions for accountable cities.

</div>

---

<div align="center">

![Footer](https://capsule-render.vercel.app/api?type=waving&color=0:00eb88,50:00dbe9,100:ff9933&height=120&section=footer&animation=fadeIn)

**CityPramaan** — Civic repairs should be provable, not promisable.

</div>
