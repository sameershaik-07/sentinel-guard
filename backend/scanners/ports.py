import socket
from urllib.parse import urlparse
from typing import List, Dict, Any

def check_open_ports(url: str) -> List[Dict[str, Any]]:
    """
    Performs a lightweight, fast port scan on critical ports.
    For a hackathon MVP, we use a 1-second timeout per port to prevent the UI from freezing.
    """
    vulnerabilities = []
    parsed_url = urlparse(url)
    hostname = parsed_url.hostname
    
    if not hostname:
        return vulnerabilities

    # Ports to scan and their associated services
    ports_to_check = {
        22: "SSH",
        80: "HTTP",
        443: "HTTPS",
        3306: "MySQL",
        3389: "RDP"
    }

    for port, service in ports_to_check.items():
        try:
            # 1 second timeout is critical here! Firewalls drop packets and cause infinite hangs.
            with socket.create_connection((hostname, port), timeout=3) as sock:
                # If we reach here, the TCP connection succeeded (port is open)
                if port == 22:
                    vulnerabilities.append({
                        "name": f"Open Port Found: {port} ({service})",
                        "severity": "High",
                        "fix_snippet": "SSH port 22 is exposed to the public internet. Restrict access using a Cloud Firewall, network Security Group, or VPN/Bastion host."
                    })
                elif port in [3306, 3389]:
                    vulnerabilities.append({
                        "name": f"Dangerous Port Exposed: {port} ({service})",
                        "severity": "Critical",
                        "fix_snippet": f"Databases and RDP should NEVER be exposed to the public internet. Close port {port} immediately in your firewall configuration."
                    })
                # Note: We ignore port 80 and 443 being open because web servers are supposed to have them open.
                
        except (socket.timeout, socket.error, ConnectionRefusedError):
            # Port is closed or filtered (dropped by firewall), which is good! Let's just move on.
            continue

    # Note: To see the "Data Exfiltration" and "Database Exposure" on the Attack Map, 
    # you would need an actual vulnerable target exposing port 3306 or 3389.
    
    return vulnerabilities
