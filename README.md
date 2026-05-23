# CityPramaan

## Proof of Repair for Accountable Cities

CityPramaan is a modern civic accountability platform that converts ordinary civic complaints into verifiable, transparent, and tamper-proof proof-of-repair records.

It helps citizens, contractors, municipal authorities, and the public track whether civic problems such as potholes, broken roads, garbage dumping, drainage overflow, water leakage, damaged streetlights, and public infrastructure failures were actually repaired — and whether the repair lasted.

> CityPramaan turns civic complaints into tamper-proof public proof of repair.

---
## Project Status

This repository contains the working MVP / hackathon prototype of CityPramaan.

The MVP demonstrates the core product flow:

- Citizen civic issue reporting
- AI-assisted issue verification
- Public civic issue dashboard
- Proof-of-repair timeline
- Contractor repair proof concept
- Warranty / repeat failure tracking concept
- Web3 proof-record architecture

The complete product vision includes real municipal integrations, production-grade blockchain deployment, real AI vision verification, GPS-based evidence validation, IPFS storage, contractor dashboards, and public repair audit systems.

## Problem Statement

Most civic complaint platforms stop at two basic states:

- Reported
- Closed

But in real cities, this is not enough.

A complaint can be marked as resolved even if the repair is poor quality. A road pothole may be filled today and break again after a few days. A streetlight may be marked fixed without public evidence. Citizens usually cannot verify contractor work, and there is no permanent trail showing what was repaired, when it was repaired, who repaired it, and whether the same issue failed again.

This creates a serious accountability gap in civic repair systems.

### Core Problem

Cities do not just need complaint tracking. They need proof that repairs actually happened and lasted.

---

## Proposed Solution

CityPramaan is a Web3 + AI civic repair accountability platform that creates a transparent proof-of-repair network for cities.

The platform allows citizens to submit geo-tagged civic reports, verifies issue evidence using AI, stores repair proof securely, records tamper-proof status updates on blockchain, tracks contractor repair evidence, monitors warranty periods, and publicly flags repeat failures.

### Main Idea

CityPramaan is not just a complaint app.

It is a Proof-of-Repair Network for accountable cities.

---

## Key Features

### Citizen Civic Reporting

Citizens can report civic issues with:

- Location
- Issue category
- Photo evidence
- Description
- Severity level
- City and area details

Supported issue types include:

- Road potholes
- Repeat road failure
- Garbage dumping
- Broken streetlights
- Water leakage
- Drainage overflow
- Damaged public infrastructure

---

### AI Damage Verification

CityPramaan uses AI to analyze civic reports and verify issue authenticity.

AI capabilities include:

- Image-based damage verification
- Issue category detection
- Severity scoring
- Duplicate issue detection
- Repeat failure detection
- Before-after repair comparison
- Automated civic report summary generation

---

### Blockchain-Based Proof Records

Every verified civic issue is converted into a tamper-proof blockchain record.

The blockchain layer stores:

- Report ID
- Evidence hash
- Status updates
- Timestamp history
- Contractor ID
- Warranty state
- Repair proof hash
- Closure proof
- Repeat failure flag

This ensures that civic repair records cannot be silently edited, deleted, or manipulated.

---

### IPFS-Based Evidence Storage

Photos and repair evidence can be stored using decentralized storage such as IPFS.

Supported evidence types include:

- Citizen complaint image
- Before-repair photo
- Contractor after-repair photo
- Geo-tagged evidence
- Proof hash
- Public audit records

---

### Contractor Accountability

Contractors can upload repair proof after completing the assigned work.

The system tracks:

- Assigned contractor
- Repair submission time
- Repair quality proof
- AI before-after comparison
- Warranty responsibility
- Repeat failure history
- Contractor reputation score

---

### Warranty Breach Scanner

CityPramaan introduces a civic repair warranty system.

If the same issue appears again near the repaired location during the warranty period, the system can automatically flag it as a repeat failure.

This helps identify:

- Poor-quality repairs
- Repeat pothole zones
- Contractor negligence
- High-risk civic areas
- Public money leakage

---

### Public Proof Timeline

Every civic issue has a transparent timeline visible to citizens, authorities, contractors, and public viewers.

Example proof timeline:

1. Citizen reports issue
2. AI verifies damage
3. Blockchain proof record is created
4. Civic admin reviews report
5. Contractor is assigned
6. Contractor uploads repair proof
7. AI verifies before-after repair quality
8. Warranty period starts
9. Repeat issue is detected or cleared
10. Public closure proof is generated

---

## Example Use Case

### City

Bhopal

### Area

MP Nagar Zone 1

### Issue

Road pothole / repeat road failure

### Flow

A citizen finds a pothole in MP Nagar Zone 1 and uploads a photo with location details. CityPramaan verifies the damage using AI, creates an evidence hash, stores the proof, and records the complaint on blockchain. The issue appears on the public civic map. After repair, the contractor uploads proof. AI compares the before and after images. A warranty period starts. If the pothole appears again in the same area, CityPramaan flags it as a repeat failure.

---

## Technical Architecture

```text
Citizen / Contractor / Civic Admin / Public Viewer
                    |
                    v
            CityPramaan Web App
        Next.js + React + Tailwind CSS
                    |
                    v
        Civic Issue Reporting System
                    |
                    v
              AI Verification Layer
 Image Analysis | Severity Score | Duplicate Check
 Before/After Comparison | AI Summary
                    |
                    v
              Evidence Storage Layer
              IPFS / Pinata / Supabase
                    |
                    v
              Blockchain Proof Layer
      Solidity Smart Contract on Testnet/Mainnet
                    |
                    v
          Public Repair Timeline + Audit Dashboard
```

---

## System Flow

```text
Citizen Report
      |
      v
AI Verification
      |
      v
Evidence Hash / IPFS Upload
      |
      v
Smart Contract Proof Record
      |
      v
Public City Map Status Pin
      |
      v
Contractor Repair Proof
      |
      v
AI Before/After Comparison
      |
      v
Warranty Monitoring
      |
      v
Repeat Failure Detection
      |
      v
Public Proof Timeline
```

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- OpenStreetMap
- Framer Motion
- Modern dashboard UI

### Backend / Database

- Supabase
- PostgreSQL
- API routes
- Civic issue metadata storage

### Web3 / Blockchain

- Solidity
- Hardhat
- Base Sepolia
- Polygon Amoy
- ethers.js
- wagmi
- Smart contract proof records

### AI / GenAI

- Gemini API
- Groq API
- Open-source vision models
- Image verification
- Severity scoring
- Before-after repair comparison
- AI-generated civic summaries

### Storage

- IPFS
- Pinata
- Supabase Storage

### Deployment

- Vercel
- GitHub
- Testnet blockchain deployment

---

## Repository Structure

```text
city-pramaan/
│
├── web/
│   ├── app/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── README.md
│
├── contracts/
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.ts
│
├── docs/
│   ├── architecture.md
│   ├── flow.md
│   └── pitch-deck.pdf
│
├── README.md
└── .gitignore
```

---

## Smart Contract Concept

The CityPramaan smart contract stores civic proof records.

### Example Data Fields

```solidity
struct CivicReport {
    uint256 reportId;
    string location;
    string issueType;
    string evidenceHash;
    string repairProofHash;
    address reporter;
    address contractor;
    uint256 createdAt;
    uint256 repairedAt;
    uint256 warrantyEndsAt;
    ReportStatus status;
    bool repeatFailureDetected;
}
```

### Possible Status Values

```text
Reported
Verified
Assigned
RepairSubmitted
RepairVerified
WarrantyActive
RepeatFailureDetected
Closed
```

---

## Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/virajkvk18/CityPramaan.git
cd CityPramaan
```

### 2. Install Frontend Dependencies

```bash
cd web
npm install
```

### 3. Run the Frontend

```bash
npm run dev
```

The app will run on:

```text
http://localhost:3000
```

---

## Environment Variables

Create a `.env.local` file inside the `web` folder.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_PINATA_GATEWAY=
PINATA_API_KEY=
PINATA_SECRET_API_KEY=

NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=

GEMINI_API_KEY=
GROQ_API_KEY=

NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_CHAIN_ID=
```

---

## Blockchain Setup

Go to the contracts folder:

```bash
cd contracts
npm install
```

Compile smart contracts:

```bash
npx hardhat compile
```

Deploy to Base Sepolia:

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

Deploy to Polygon Amoy:

```bash
npx hardhat run scripts/deploy.ts --network polygonAmoy
```

---

## Product Modules

### 1. Citizen Portal

- Submit civic issue
- Upload photo evidence
- Add location details
- Track complaint status
- View public proof timeline

### 2. AI Verification Engine

- Detect civic issue from image
- Score damage severity
- Detect duplicate complaints
- Compare before-after repair evidence
- Generate AI-based report summary

### 3. Civic Admin Dashboard

- View city-level reports
- Assign contractors
- Monitor high-risk zones
- Track repair timelines
- Validate repair evidence

### 4. Contractor Dashboard

- View assigned repair tasks
- Upload after-repair proof
- Track warranty obligations
- Build reputation score

### 5. Public Audit Dashboard

- View map-based civic issues
- Track repaired and pending issues
- See blockchain proof timeline
- Detect repeat failure zones
- Monitor contractor accountability

---

## Why CityPramaan Is Unique

| Existing Complaint Apps | CityPramaan |
|---|---|
| Stops at complaint tracking | Tracks full proof-of-repair lifecycle |
| Closure can be faked | Closure needs verifiable repair proof |
| No public warranty trail | Warranty monitoring for repeat failures |
| No immutable history | Blockchain-backed proof record |
| Limited transparency | Public civic audit dashboard |
| No contractor accountability | Contractor reputation and repair history |

---

## Real-World Impact

CityPramaan can help cities:

- Increase transparency in civic repair work
- Reduce fake complaint closures
- Improve contractor accountability
- Identify repeat failure zones
- Save public money through warranty enforcement
- Build citizen trust
- Create public repair audit trails
- Improve smart city governance

---

## Future Scope

- Real GPS-based location verification
- Live municipal complaint integration
- Production smart contract deployment
- AI-powered fraud detection
- Contractor leaderboard
- Ward-wise civic performance score
- Citizen reward system
- WhatsApp complaint bot
- Mobile app for citizens and contractors
- Integration with municipal dashboards
- Expansion to garbage, drainage, water leakage, streetlights, and public infrastructure

---

## Hackathon Track

Primary Track:

```text
Smart Cities / Civic Tech
```

Secondary Tracks:

```text
Web3
Blockchain
AI / GenAI
Web Development
```

---

## Project Links

```text
GitHub Repository: https://github.com/virajkvk18/CityPramaan
Live Demo: Add your deployment link here
Demo Video: Add your demo video link here
Pitch Deck: Add your pitch deck link here
```

---

## Team

```text
Team Name: Add your team name
Team Leader: Add leader name
College / Institute: Add college name
```

---

## Closing Statement

CityPramaan makes civic repairs provable, accountable, and impossible to quietly fake.

It transforms civic complaints from simple reports into transparent, verifiable, blockchain-backed public proof of repair.

---

## Author

Built by Viraj Kumar Vishwakarma.

GitHub: https://github.com/virajkvk18
