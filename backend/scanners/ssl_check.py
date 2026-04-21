import ssl
import socket
from urllib.parse import urlparse
from datetime import datetime, timezone
from typing import List, Dict, Any

def check_ssl_certificate(url: str) -> List[Dict[str, Any]]:
    """
    Checks the SSL/TLS certificate of the target URL.
    Returns vulnerabilities if the certificate is invalid, expiring soon, or if not using HTTPS.
    """
    vulnerabilities = []
    
    parsed_url = urlparse(url)
    hostname = parsed_url.hostname
    
    # Check if the URL string has a hostname, if not it might be improperly formatted
    if not hostname:
        return []
        
    port = parsed_url.port or 443
    
    # 1. Check if the scheme is explicitly HTTP instead of HTTPS
    if parsed_url.scheme == 'http':
        vulnerabilities.append({
            "name": "Missing HTTPS (Insecure Protocol)",
            "severity": "Critical",
            "fix_snippet": "Force all traffic over HTTPS. Ensure an SSL/TLS certificate is installed and configure the web server to redirect HTTP (port 80) to HTTPS (port 443)."
        })
        return vulnerabilities  # Do not attempt to read a cert on pure HTTP
        
    # We only check SSL on HTTPS
    if parsed_url.scheme != 'https':
        return []

    context = ssl.create_default_context()
    
    try:
        # A short timeout to ensure the api does not freeze
        with socket.create_connection((hostname, port), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                
                # 2. Check Expiration Date
                not_after_str = cert.get('notAfter')
                if not_after_str:
                    # Expiration format: 'May 16 23:59:59 2026 GMT'
                    not_after = datetime.strptime(not_after_str, '%b %d %H:%M:%S %Y %Z')
                    not_after = not_after.replace(tzinfo=timezone.utc)
                    days_left = (not_after - datetime.now(timezone.utc)).days
                    
                    if days_left < 0:
                        vulnerabilities.append({
                            "name": "SSL/TLS Certificate Expired",
                            "severity": "Critical",
                            "fix_snippet": "The SSL certificate has expired. Visitors will see a severe browser warning. Renew immediately using a trusted CA like Let's Encrypt."
                        })
                    elif days_left < 30:
                        vulnerabilities.append({
                            "name": "SSL/TLS Certificate Expiring Soon",
                            "severity": "Medium",
                            "fix_snippet": f"The SSL certificate expires in {days_left} days. Setup an auto-renewal job to prevent service disruption."
                        })
                        
    except ssl.SSLCertVerificationError as e:
        # 3. Handle Self-Signed or Untrusted Certificates
        vulnerabilities.append({
            "name": "Untrusted or Invalid SSL/TLS Certificate",
            "severity": "Critical",
            "fix_snippet": f"The certificate is self-signed or not trusted. Issue a certificate from a trusted Certificate Authority (CA). Details: {str(e)}"
        })
    except socket.timeout:
        pass # Timeout is already handled as 'Server Unreachable' by the headers scanner
    except Exception as e:
        vulnerabilities.append({
            "name": "SSL/TLS Connection Failure",
            "severity": "High",
            "fix_snippet": f"Could not establish a secure connection on port {port}. Details: {str(e)}"
        })

    return vulnerabilities
