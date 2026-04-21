import requests
from typing import List, Dict, Any

def check_security_headers(url: str) -> List[Dict[str, Any]]:
    """
    Scans a given URL for common HTTP security headers.
    Returns a list of vulnerabilities found (missing or misconfigured headers).
    """
    vulnerabilities = []
    
    try:
        # We use a short timeout for the hackathon demo so it doesn't freeze
        # Added a User-Agent to prevent getting blocked by basic WAFs
        response = requests.get(
            url, 
            timeout=10, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'}
        )
        headers = response.headers
        
        # 1. HSTS (Strict-Transport-Security)
        if 'Strict-Transport-Security' not in headers:
            vulnerabilities.append({
                "name": "Missing Strict-Transport-Security (HSTS)",
                "severity": "High",
                "fix_snippet": "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains' to your server headers. This forces browsers to only connect via HTTPS."
            })
            
        # 2. Content-Security-Policy (CSP)
        if 'Content-Security-Policy' not in headers:
            vulnerabilities.append({
                "name": "Missing Content-Security-Policy",
                "severity": "Medium",
                "fix_snippet": "Implement a CSP header like 'Content-Security-Policy: default-src \\'self\\''. This helps prevent Cross-Site Scripting (XSS) attacks."
            })
            
        # 3. X-Frame-Options
        if 'X-Frame-Options' not in headers:
            vulnerabilities.append({
                "name": "Missing X-Frame-Options",
                "severity": "Low",
                "fix_snippet": "Set 'X-Frame-Options: DENY' or 'SAMEORIGIN' to protect visitors against clickjacking attacks."
            })

        # 4. X-Content-Type-Options
        if 'X-Content-Type-Options' not in headers:
            vulnerabilities.append({
                "name": "Missing X-Content-Type-Options",
                "severity": "Low",
                "fix_snippet": "Set 'X-Content-Type-Options: nosniff'. This prevents the browser from interpreting files as a different MIME type to what is specified."
            })
            
    except requests.exceptions.RequestException as e:
        # If the website doesn't exist or times out, we return a critical error as a vulnerability
        vulnerabilities.append({
            "name": "Server Unreachable",
            "severity": "Critical",
            "fix_snippet": f"Ensure the target URL is correct and the server is online. Error: {str(e)}"
        })

    return vulnerabilities
