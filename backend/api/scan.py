from fastapi import APIRouter
from models.scan import ScanRequest, ScanResponse, Vulnerability, ReconData
from scanners.headers import check_security_headers
from scanners.ssl_check import check_ssl_certificate
from scanners.ports import check_open_ports
from scanners.recon import perform_passive_recon
from utils.db import save_scan_result
from utils.mermaid import generate_attack_map, generate_graph_json
from utils.ai import generate_ai_remediation

router = APIRouter()

def calculate_score(vulnerabilities):
    """
    Mock grading logic for MVP: Start with 100%, subtract points for missing headers.
    """
    score_percentage = 100
    
    for vuln in vulnerabilities:
        if vuln["severity"] == "Critical":
            score_percentage -= 50
        elif vuln["severity"] == "High":
            score_percentage -= 20
        elif vuln["severity"] == "Medium":
            score_percentage -= 10
        elif vuln["severity"] == "Low":
            score_percentage -= 5
            
    # Cap between 0 and 100
    score_percentage = max(0, min(100, score_percentage))
    
    # Assign Letter Grade
    if score_percentage >= 90:
        score = "A"
    elif score_percentage >= 80:
        score = "B"
    elif score_percentage >= 70:
        score = "C"
    elif score_percentage >= 60:
        score = "D"
    else:
        score = "F"
        
    return score, score_percentage

@router.post("/scan", response_model=ScanResponse)
async def run_scan(request: ScanRequest):
    url_str = str(request.target_url)
    
    # Ensure scheme is present
    if not url_str.startswith('http://') and not url_str.startswith('https://'):
        url_str = 'https://' + url_str
    
    # 1. Run HTTP Security Headers Scan
    header_vulnerabilities = check_security_headers(url_str)
    
    # 2. Run SSL/TLS Certificate Scan
    ssl_vulnerabilities = check_ssl_certificate(url_str)
    
    # 3. Run Lightweight Port Scan
    port_vulnerabilities = check_open_ports(url_str)
    
    all_vulns = header_vulnerabilities + ssl_vulnerabilities + port_vulnerabilities
    
    # 4. Calculate Final Score
    score_letter, score_percentage = calculate_score(all_vulns)
    
    # 4.1 Generate AI Remediation
    ai_fix = generate_ai_remediation(url_str, all_vulns)
    
    # 4.2 Perform Passive Reconnaissance
    recon_data = perform_passive_recon(url_str)
    
    # 6. Create the typed response
    vulnerabilities = [Vulnerability(**v) for v in all_vulns]
    mermaid_str = generate_attack_map(url_str, all_vulns)
    graph_data = generate_graph_json(url_str, all_vulns)

    # 5. Save exactly to our database schema
    save_scan_result(
        url_str, 
        score_letter, 
        score_percentage, 
        all_vulns, 
        ai_remediation=ai_fix,
        mermaid_syntax=mermaid_str,
        recon_data=recon_data
    )

    return {
        "target_url": url_str,
        "score": score_letter,
        "score_percentage": score_percentage,
        "vulnerabilities": vulnerabilities,
        "ai_remediation": ai_fix,
        "mermaid_syntax": mermaid_str,
        "graph_data": graph_data,
        "recon_data": ReconData(**recon_data),
        "status": "success",
        "message": f"Scan completed for {url_str}"
    }
