# Sentinel-Guard

Sentinel-Guard is a full-stack cloud security audit platform that scans a target URL, detects common vulnerabilities, scores security posture, and generates visual + PDF executive reports.

It includes:
- A Next.js dashboard for running scans and viewing history
- A FastAPI backend for scanning, scoring, logs, reports, and WebSocket streaming
- Optional Azure Cosmos DB persistence
- Optional Google Gemini remediation assistance
- Attack surface visualization (React Flow + Mermaid)

## Table of Contents

- [What It Does](#what-it-does)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick Start (Local)](#quick-start-local)
- [How to Access the App](#how-to-access-the-app)
- [Environment Variables](#environment-variables)
- [Backend API Reference](#backend-api-reference)
- [How a Scan Works](#how-a-scan-works)
- [Development Commands](#development-commands)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [Known Project Quirks](#known-project-quirks)

## What It Does

Sentinel-Guard performs a multi-step security scan for a target website:

1. HTTP security header checks
2. SSL/TLS checks (invalid, expired, expiring certs)
3. Lightweight public port exposure checks
4. Passive recon (tech stack fingerprinting + subdomain intel)
5. Score calculation (A-F + percentage)
6. AI remediation suggestions (optional)
7. Visual attack path generation (Mermaid and React Flow)
8. Executive PDF report generation

## Architecture

High-level request flow:

1. User submits URL in frontend dashboard.
2. Frontend opens `ws://.../ws/scan` (or `wss://`) to backend.
3. Backend runs scanners and streams progress updates.
4. Backend returns final result payload (score, vulnerabilities, maps, recon, remediation).
5. Frontend renders scorecards, vulnerability list, topology map, and logs.
6. User can download PDF report and view historical scans.

## Tech Stack

Frontend:
- Next.js `16.2.4` (App Router)
- React `19.2.4`
- TypeScript
- Tailwind CSS `v4`
- `@xyflow/react` + `dagre` for interactive graph layout
- Mermaid for topology diagrams
- `lucide-react` icons

Backend:
- Python + FastAPI
- Uvicorn
- Pydantic
- `requests`, `websockets`, `cryptography`
- Report generation: ReportLab + optional WeasyPrint

Cloud / Integrations:
- Azure Cosmos DB (optional persistence)
- Azure Sentinel API (optional alert enrichment)
- Google Gemini (`google-generativeai`) for remediation suggestions (optional)
- Kroki for Mermaid-to-image rendering in PDF

## Repository Structure

Important folders:

- `backend/` FastAPI API, scanners, data/model utilities, reporting
- `frontend/` Next.js UI (recommended frontend workspace)
- `src/` duplicate frontend source tree also exists at repo root

Backend highlights:
- `backend/main.py` app entry, CORS, router registration, WebSocket scan endpoint
- `backend/api/scan.py` synchronous scan endpoint and scoring logic
- `backend/api/history.py` scan history endpoint
- `backend/api/logs.py` SIEM-style logs endpoint
- `backend/api/report.py` PDF endpoint
- `backend/scanners/*` header/SSL/port/recon scanning modules
- `backend/utils/db.py` Cosmos DB integration
- `backend/utils/ai.py` Gemini remediation
- `backend/utils/mermaid.py` map + graph generation
- `backend/utils/pdf_gen.py` report creation

Frontend highlights:
- `frontend/src/app/page.tsx` dashboard page
- `frontend/src/app/history/page.tsx` history page
- `frontend/src/components/UrlForm.tsx` scan trigger + WebSocket client
- `frontend/src/lib/runtime-config.ts` API/WS base URL construction

## Prerequisites

- Node.js 20+
- npm
- Python 3.10+
- pip

Optional (for advanced features):
- Azure account with Cosmos DB and Sentinel workspace
- Gemini API key

## Quick Start (Local)

### 1) Start Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs on: `http://localhost:8000`

You can also use:

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

Edit `.env.local` for local backend:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

Run dev server:

```bash
npm run dev
```

Frontend runs on: `http://localhost:3000`

## How to Access the App

After both services are running:

- Dashboard UI: `http://localhost:3000`
- History page: `http://localhost:3000/history`
- Backend health: `http://localhost:8000/`
- Backend Swagger docs: `http://localhost:8000/docs`
- Backend ReDoc: `http://localhost:8000/redoc`

How to use:

1. Open dashboard (`/`).
2. Enter target URL and click **Run Audit**.
3. Watch live scan feed and progress.
4. Review score, vulnerabilities, recon intel, and attack map.
5. Download executive PDF.
6. Open `/history` to view archived scans and download reports again.

## Environment Variables

Backend (`backend/.env`):

```env
COSMOS_ENDPOINT=
COSMOS_KEY=
GEMINI_API_KEY=
AZURE_SUBSCRIPTION_ID=
AZURE_RESOURCE_GROUP=
AZURE_WORKSPACE_NAME=
```

Frontend (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

Notes:
- If Cosmos is not configured, backend falls back to memory mode for persistence-related operations.
- If Gemini key is missing, AI remediation returns a graceful fallback message.
- If frontend API/WS env vars are not set, calls can default to wrong host/port in local setups.

## Backend API Reference

Base URL: `http://localhost:8000`

### HTTP Endpoints

- `GET /`
	- Health/status check.

- `POST /api/scan`
	- Runs a scan and returns full result payload.
	- Request body:

```json
{
	"target_url": "https://example.com"
}
```

- `GET /api/history`
	- Returns previous scans (when stored in Cosmos DB).

- `GET /api/logs`
	- Returns SIEM-style logs derived from scan history.

- `GET /api/report/{scan_id}`
	- Streams downloadable executive PDF for a scan id.

### WebSocket

- `WS /ws/scan`
	- Send:

```json
{ "target_url": "https://example.com" }
```

	- Receive progress events (`type: info`) and final result (`type: result`) or error (`type: error`).

## How a Scan Works

### Security checks

- Header scanner checks:
	- Strict-Transport-Security
	- Content-Security-Policy
	- X-Frame-Options
	- X-Content-Type-Options

- SSL scanner checks:
	- HTTP vs HTTPS usage
	- certificate validity
	- expiration window
	- handshake/cert failures

- Port scanner checks:
	- 22 (SSH)
	- 80 (HTTP)
	- 443 (HTTPS)
	- 3306 (MySQL)
	- 3389 (RDP)

### Score model

Initial score = 100.

Severity deductions:
- Critical: `-50`
- High: `-20`
- Medium: `-10`
- Low: `-5`

Final grade:
- A: `>= 90`
- B: `>= 80`
- C: `>= 70`
- D: `>= 60`
- F: `< 60`

### Intelligence + Reporting

- Passive recon detects probable stack signatures and subdomains from cert transparency.
- AI remediation proposes context-aware fixes when key is configured.
- Attack map is generated in Mermaid + React Flow JSON.
- PDF report includes summary, findings, recon, remediation, and topology artifact.

## Development Commands

Frontend (`frontend/`):

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Backend (`backend/`):

```bash
uvicorn main:app --reload --port 8000
```

Repo helper test script:

```bash
./test.sh
```

## Troubleshooting

- Frontend shows no data / logs:
	- Confirm backend is running on port `8000`.
	- Confirm `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_BASE_URL` are set in `frontend/.env.local`.

- WebSocket errors during scan:
	- Verify `ws://localhost:8000/ws/scan` is reachable.
	- Check backend console for scanner exceptions.

- PDF generation issues:
	- WeasyPrint may require native system packages. The app falls back to ReportLab PDF automatically.

- History is empty:
	- Cosmos DB is optional. Without valid Cosmos settings, history persistence is limited/fallback.

## Security Notes

- CORS is currently configured as open (`allow_origins=["*"]`) for MVP/dev convenience.
- Harden before production:
	- restrict CORS origins
	- add authentication and rate limiting
	- add request validation hardening and tighter timeouts
	- avoid insecure HTTP calls in recon flows

## Known Project Quirks

- There are duplicate frontend trees in repo root and in `frontend/`.
- There are duplicate frontend config files in root and `frontend/`.
- Recommended active frontend workspace is `frontend/` to avoid ambiguity.

---

If you want, this README can be split into:
- `README.md` (quick start)
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/DEPLOYMENT.md`

for easier team maintenance.
