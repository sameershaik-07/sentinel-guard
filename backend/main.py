import json
import asyncio
from dotenv import load_dotenv
load_dotenv() # Load variables from .env before initializing routers

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from api.scan import router as scan_router, calculate_score
from scanners.headers import check_security_headers
from scanners.ssl_check import check_ssl_certificate
from scanners.ports import check_open_ports
from scanners.recon import perform_passive_recon
from models.scan import Vulnerability
from utils.mermaid import generate_attack_map, generate_graph_json
from utils.ai import generate_ai_remediation

from api.history import router as history_router
from api.logs import router as logs_router
from api.report import router as report_router
from utils.db import init_db
from utils.ws import manager

app = FastAPI(
    title="Sentinel-Guard API",
    description="Backend API for Sentinel-Guard Cloud Security Auditor",
    version="1.0.0"
)

# Configure CORS to allow the Next.js frontend to communicate with the Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for MVP. Update to ["http://localhost:3000"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the mock database on startup
init_db()

# Register our scanning API endpoints
app.include_router(scan_router, prefix="/api")
app.include_router(history_router, prefix="/api")
app.include_router(logs_router, prefix="/api")
app.include_router(report_router, prefix="/api")

from utils.db import save_scan_result

@app.websocket("/ws/scan")
async def websocket_scan_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                request_data = json.loads(data)
                url_str = request_data.get("target_url")
                if not url_str:
                    await manager.send_personal_json({"status": "error", "type": "error", "message": "Missing target_url"}, websocket)
                    continue
                
                # Ensure scheme is present
                if not url_str.startswith('http://') and not url_str.startswith('https://'):
                    url_str = 'https://' + url_str
                
                await manager.send_personal_json({"status": "Starting scan...", "type": "info"}, websocket)

                # Initialize error log to capture any scanner exceptions without aborting
                error_log = []

                # 1. Run HTTP Security Headers Scan
                await manager.send_personal_json({"status": "Checking Security Headers...", "type": "info"}, websocket)
                await asyncio.sleep(0.1) # Yield control to ensure flush
                try:
                    header_vulnerabilities = await asyncio.to_thread(check_security_headers, url_str)
                except Exception as e:
                    header_vulnerabilities = []
                    err = f"Headers scan failed: {str(e)}"
                    await manager.send_personal_json({"status": err, "type": "warning"}, websocket)
                    error_log.append(err)

                # 2. Run SSL/TLS Certificate Scan
                await manager.send_personal_json({"status": "Checking SSL/TLS Certificates...", "type": "info"}, websocket)
                await asyncio.sleep(0.1) # Yield control to ensure flush
                try:
                    ssl_vulnerabilities = await asyncio.to_thread(check_ssl_certificate, url_str)
                except Exception as e:
                    ssl_vulnerabilities = []
                    err = f"SSL scan failed: {str(e)}"
                    await manager.send_personal_json({"status": err, "type": "warning"}, websocket)
                    error_log.append(err)

                # 3. Run Lightweight Port Scan
                await manager.send_personal_json({"status": "Discovering Open Ports...", "type": "info"}, websocket)
                await asyncio.sleep(0.1) # Yield control to ensure flush
                try:
                    port_vulnerabilities = await asyncio.to_thread(check_open_ports, url_str)
                except Exception as e:
                    port_vulnerabilities = []
                    err = f"Port scan failed: {str(e)}"
                    await manager.send_personal_json({"status": err, "type": "warning"}, websocket)
                    error_log.append(err)

                all_vulns = header_vulnerabilities + ssl_vulnerabilities + port_vulnerabilities
                
                # 4. Calculate Final Score
                await manager.send_personal_json({"status": "Calculating Security Score...", "type": "info"}, websocket)
                await asyncio.sleep(0.1) # Yield control to ensure flush
                score_letter, score_percentage = calculate_score(all_vulns)
                
                # 4.1 Generate AI Remediation
                await manager.send_personal_json({"status": "AI Analyst: Generating remediation fixes...", "type": "info"}, websocket)
                await asyncio.sleep(0.1) # Yield control to ensure flush
                try:
                    ai_fix = await asyncio.to_thread(generate_ai_remediation, url_str, all_vulns)
                except Exception as e:
                    ai_fix = "AI remediation generation failed to complete. See error log."
                    err = f"AI remediation error: {str(e)}"
                    await manager.send_personal_json({"status": err, "type": "warning"}, websocket)
                    error_log.append(err)
                
                # 4.2 Passive Reconnaissance
                await manager.send_personal_json({"status": "Reconnaissance: Fingerprinting target and scraping OSINT...", "type": "info"}, websocket)
                await asyncio.sleep(0.1)
                try:
                    recon_data = await asyncio.to_thread(perform_passive_recon, url_str)
                except Exception as e:
                    recon_data = {}
                    err = f"Reconnaissance error: {str(e)}"
                    await manager.send_personal_json({"status": err, "type": "warning"}, websocket)
                    error_log.append(err)
                
                # 5. Generate final data elements before saving
                await manager.send_personal_json({"status": "Generating Final Report...", "type": "info"}, websocket)
                await asyncio.sleep(0.1) # Yield control to ensure flush
                vulnerabilities = [Vulnerability(**v).model_dump() for v in all_vulns]
                try:
                    mermaid_str = await asyncio.to_thread(generate_attack_map, url_str, all_vulns)
                except Exception as e:
                    mermaid_str = "graph TD\nLocal-->Firewall\nFirewall-->Internet"
                    err = f"Attack map generation failed: {str(e)}"
                    await manager.send_personal_json({"status": err, "type": "warning"}, websocket)
                    error_log.append(err)

                try:
                    react_graph = await asyncio.to_thread(generate_graph_json, url_str, all_vulns)
                except Exception as e:
                    react_graph = {}
                    err = f"Graph JSON generation failed: {str(e)}"
                    await manager.send_personal_json({"status": err, "type": "warning"}, websocket)
                    error_log.append(err)

                # Build findings summary for storage and reporting
                severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "unknown": 0}
                top_findings = []
                open_ports = []
                for v in all_vulns:
                    try:
                        name = v.get("name", "") if isinstance(v, dict) else str(v)
                        sev = (v.get("severity", "").upper() if isinstance(v, dict) else "")
                    except Exception:
                        name = str(v)
                        sev = ""

                    if "CRITICAL" in sev:
                        severity_counts["critical"] += 1
                    elif "HIGH" in sev:
                        severity_counts["high"] += 1
                    elif "MEDIUM" in sev:
                        severity_counts["medium"] += 1
                    elif "LOW" in sev:
                        severity_counts["low"] += 1
                    else:
                        severity_counts["unknown"] += 1

                    if "port" in name.lower():
                        open_ports.append(name)

                    if "port" in name.lower() or sev in ("HIGH", "CRITICAL"):
                        top_findings.append({"name": name, "severity": sev})

                findings_summary = {
                    "counts": severity_counts,
                    "top_findings": top_findings,
                    "open_ports": open_ports
                }

                scan_id = await asyncio.to_thread(
                    save_scan_result,
                    url_str,
                    score_letter,
                    score_percentage,
                    all_vulns,
                    ai_remediation=ai_fix,
                    mermaid_syntax=mermaid_str,
                    recon_data=recon_data,
                    findings_summary=findings_summary,
                    error_log=error_log
                )
                
                await manager.send_personal_json({
                    "status": "success",
                    "type": "result",
                    "data": {
                        "id": scan_id,
                        "target_url": url_str,
                        "score": score_letter,
                        "score_percentage": score_percentage,
                        "vulnerabilities": vulnerabilities,
                        "ai_remediation": ai_fix,
                        "recon_data": recon_data,
                        "mermaid_syntax": mermaid_str,
                        "graph_data": react_graph,
                        "message": f"Scan completed for {url_str}"
                    }
                }, websocket)
                
            except Exception as e:
                await manager.send_personal_json({"status": "error", "type": "error", "message": str(e)}, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
def read_root():
    return {"status": "Sentinel-Guard API is running!", "message": "Ready to scan."}

# We will add scanning endpoints here in the next steps!
