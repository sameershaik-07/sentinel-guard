# Sentinel-Guard

Sentinel-Guard is an AI-assisted cloud security auditing platform designed to help teams quickly evaluate a web target, understand exposure, and act on remediation with confidence.

It combines real-time scanning, security scoring, attack path visualization, and downloadable executive reporting in one end-to-end workflow.

## Table of Contents

- [Project Overview](#project-overview)
- [How Sentinel-Guard Helps](#how-sentinel-guard-helps)
- [Core Capabilities](#core-capabilities)
- [User Journey](#user-journey)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Local Setup](#local-setup)
- [How to Access Locally](#how-to-access-locally)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Development Commands](#development-commands)

## Project Overview

Sentinel-Guard scans a target URL and provides a complete security intelligence package:

- Vulnerability detection across headers, TLS posture, and network exposure
- Security grading with both letter score and numeric percentage
- AI-generated remediation guidance
- Attack surface and lateral movement visualization
- Recon intelligence (technology fingerprinting and subdomains)
- Executive PDF report generation
- Historical scan archive and SIEM-style activity feed

This makes it useful for demos, internal security reviews, client reporting, and rapid first-pass risk assessment.

## How Sentinel-Guard Helps

Sentinel-Guard helps by turning raw findings into actionable outcomes:

- Faster triage: critical findings are surfaced immediately with severity context
- Better communication: visual maps and PDF reports make findings easy to present
- More practical fixes: AI remediation provides implementation-oriented guidance
- Continuous visibility: scan history and logs create a living security timeline
- Team alignment: one dashboard for engineering, security, and stakeholders

## Core Capabilities

1. URL-based audit execution from a web dashboard
2. Real-time scan progress over WebSocket
3. Header security validation:
   - Strict-Transport-Security
   - Content-Security-Policy
   - X-Frame-Options
   - X-Content-Type-Options
4. SSL/TLS checks:
   - HTTPS usage
   - Certificate trust and validity
   - Expiration risk window
5. Lightweight port exposure checks:
   - 22, 80, 443, 3306, 3389
6. Passive reconnaissance:
   - Tech stack hints from headers/content
   - Subdomains from certificate transparency data
7. Score engine:
   - 0 to 100 percentage
   - Letter grade from A to F
8. AI remediation assistant (optional key)
9. Attack map generation in Mermaid and React Flow graph JSON
10. Executive report download as PDF

## User Journey

1. Open dashboard and enter a target URL.
2. Launch scan and monitor live feed in the UI.
3. Review score, vulnerabilities, and intelligence details.
4. Explore attack topology in interactive and diagram views.
5. Download executive report PDF.
6. Visit history page to review prior scans and download reports again.

## Technology Stack

### Frontend

- Next.js 16.2.4 (App Router)
- React 19.2.4
- TypeScript
- Tailwind CSS v4
- @xyflow/react + dagre (interactive graph rendering and layout)
- Mermaid (diagram syntax rendering)
- lucide-react (UI icons)

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- requests, websockets, cryptography
- Report generation with WeasyPrint and ReportLab fallback

### Cloud and Integrations

- Azure Cosmos DB (scan persistence)
- Azure Sentinel APIs (alert enrichment)
- Google Gemini via google-generativeai (AI remediation)
- Kroki (Mermaid diagram to image for reporting)

## Architecture

High-level flow:

1. Frontend sends target URL to backend WebSocket endpoint.
2. Backend executes scanner pipeline and streams progress events.
3. Backend computes score, generates remediation, recon data, and map artifacts.
4. Backend stores scan metadata and findings.
5. Frontend renders scorecards, logs, findings, intelligence, and maps.
6. PDF report endpoint produces downloadable executive output.

Primary backend modules:

- API routes for scan, history, logs, and report
- Scanner modules for headers, SSL/TLS, ports, and recon
- Utility modules for database, AI, WebSocket manager, map generation, and PDF generation

## Repository Layout

Key directories:

- backend/
  - FastAPI application, scanner pipeline, models, and reporting utilities
- frontend/
  - Next.js dashboard and history UI

Primary entry points:

- backend/main.py
- backend/api/scan.py
- frontend/src/app/page.tsx
- frontend/src/app/history/page.tsx

## Local Setup

### Prerequisites

- Node.js 20+
- npm
- Python 3.10+
- pip

### 1) Start Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Alternative startup script:

```bash
cd backend
./start_backend.sh
```

### 2) Start Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

Update frontend environment values:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

Run frontend:

```bash
npm run dev
```

## How to Access Locally

After both services are running:

- Dashboard: http://localhost:3000
- History: http://localhost:3000/history
- Backend root health: http://localhost:8000/
- Backend Swagger docs: http://localhost:8000/docs
- Backend ReDoc docs: http://localhost:8000/redoc

## Deployment

Sentinel-Guard is deployed using:

- Vercel for the frontend (Next.js application)
- Railway for the backend (FastAPI API and WebSocket services)

This deployment model keeps the UI globally accessible while maintaining a dedicated backend runtime for scanning, reporting, and real-time updates.

## Environment Variables

Backend (backend/.env):

```env
COSMOS_ENDPOINT=
COSMOS_KEY=
GEMINI_API_KEY=
# Optional: preferred multi-key format for failover
GEMINI_API_KEYS=key_one,key_two,key_three
# Optional alternate format
# GEMINI_API_KEY_1=
# GEMINI_API_KEY_2=
```

Frontend (frontend/.env.local):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

## API Reference

Base URL: http://localhost:8000

### HTTP Endpoints

- GET /
  - Service status endpoint

- POST /api/scan
  - Execute scan and return complete result object
  - Request body:

```json
{
  "target_url": "https://example.com"
}
```

- GET /api/history
  - Return stored scan records

- GET /api/logs
  - Return SIEM-style log feed

- GET /api/report/{scan_id}
  - Generate and download executive report PDF

### WebSocket Endpoint

- WS /ws/scan
  - Send payload:

```json
{
  "target_url": "https://example.com"
}
```

  - Receive:
    - info events for scan progress
    - result event with final payload
    - error event when applicable

## Development Commands

Frontend (frontend/):

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Backend (backend/):

```bash
uvicorn main:app --reload --port 8000
```

Optional repo helper script:

```bash
./tests/test.sh
```
