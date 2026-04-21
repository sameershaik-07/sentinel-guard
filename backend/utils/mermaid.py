from typing import List, Dict, Any
from .sentinel import fetch_sentinel_alerts

class SecurityNode:
    """Segment 1: Graph-Based Data Model - Node"""
    def __init__(self, id: str, label: str, node_type: str = "secure",
                 ip_address: str = "Unknown", service_type: str = "Generic",
                 open_ports: List[int] = None, vulnerability_score: int = 0,
                 compromised: bool = False, threat_level: str = "None"):
        self.id = id
        self.label = label
        self.node_type = node_type  # secure, warning, critical
        self.ip_address = ip_address
        self.service_type = service_type
        self.open_ports = open_ports if open_ports is not None else []
        self.vulnerability_score = vulnerability_score
        self.compromised = compromised
        self.threat_level = threat_level

class SecurityEdge:
    """Segment 1: Graph-Based Data Model - Edge"""
    def __init__(self, source: str, target: str, description: str, 
                 edge_style: str = "normal", protocol: str = "TCP", 
                 is_encrypted: bool = True):
        self.source = source
        self.target = target
        self.description = description
        self.edge_style = edge_style # normal, dotted, thick
        self.protocol = protocol
        self.is_encrypted = is_encrypted

def calculate_attack_paths(target_url: str, vulnerabilities: List[Dict[str, Any]], sentinel_alerts: List[Dict[str, Any]] = None) -> tuple[List[SecurityNode], List[SecurityEdge]]:
    """Segment 2: Implementing Bypass and Lateral Movement Logic"""
    if sentinel_alerts is None:
        sentinel_alerts = []
        
    domain = target_url.replace('https://', '').replace('http://', '').split('/')[0]
    
    # 1. Instantiate the Graph Nodes
    nodes = {
        "Internet": SecurityNode("Internet", "Internet / Attacker"),
        "Firewall": SecurityNode("Firewall", "Cloud WAF / Gateway"),
        "LoadBalancer": SecurityNode("LoadBalancer", "Load Balancer HTTPS"),
        "AppServerA": SecurityNode("AppServerA", f"Web App A: {domain}"),
        "AppServerB": SecurityNode("AppServerB", "Internal Web App B"),
        "Database": SecurityNode("Database", "Internal Database / Storage"),
        "Identity": SecurityNode("Identity", "IAM / Service Principal")
    }
    
    # 2. Instantiate the Base Architecture Edges
    edges = [
        SecurityEdge("Internet", "Firewall", "Standard Traffic"),
        SecurityEdge("Firewall", "LoadBalancer", "Filtered"),
        SecurityEdge("LoadBalancer", "AppServerA", "Port 443"),
        SecurityEdge("AppServerA", "Database", "Private IP"),
        SecurityEdge("AppServerA", "Identity", "Assuming Role"),
        # Base state: Implicit VNet boundaries usually stop traffic, but they exist
        SecurityEdge("AppServerA", "AppServerB", "Same VNet - Isolated", "normal", "TCP", True),
        SecurityEdge("AppServerB", "Database", "Private IP")
    ]
    
    vuln_names = [v["name"] for v in vulnerabilities]
    
    # --- Lateral Movement & Bypass Brain (Segments 2 & 5) ---
    
    # Load Balancer / SSL issues
    if any("SSL" in name or "HTTPS" in name for name in vuln_names):
        nodes["LoadBalancer"].node_type = "critical"
        for e in edges:
            if e.source == "LoadBalancer" and e.target == "AppServerA":
                e.description = "Data Sniffing (Port 80)"
                
    # Database Exposure & Exfiltration
    if any("Dangerous Port" in name for name in vuln_names):
        nodes["Database"].node_type = "critical"
        # Direct bypass from internet
        edges.append(SecurityEdge("Internet", "Database", "Direct DB Bypass (Port 3306/3389)", "dotted"))
        
    # Segment 5: The "Exfiltration" Path (Data Leakage)
    # Check for outbound rules to the internet (0.0.0.0/0)
    has_outbound_internet = any("0.0.0.0/0" in name or "Outbound" in name for name in vuln_names)
    
    if has_outbound_internet or any("Exfiltration" in name for name in vuln_names):
        nodes["Database"].node_type = "critical"
        nodes["Database"].compromised = True
        edges.append(SecurityEdge("Database", "Internet", "Data Exfiltration Risk (0.0.0.0/0)", "thick", "TCP", False))
        
    # App Security Headers
    if any("Header" in name or "Policy" in name or "HSTS" in name for name in vuln_names):
        nodes["AppServerA"].node_type = "warning"
        
    # Direct SSH Bypass & Lateral Movement
    if any("Port Found: 22" in name for name in vuln_names):
        nodes["AppServerA"].node_type = "critical"
        # 1. Direct Bypass
        edges.append(SecurityEdge("Internet", "AppServerA", "Brute Force SSH Bypass (Port 22)", "dotted"))
        
        # 3. Lateral Movement: Once App A is breached, they hop to App B because it's in the same VNet
        nodes["AppServerB"].node_type = "warning"
        for e in edges:
            if e.source == "AppServerA" and e.target == "AppServerB":
                e.description = "Lateral Movement (VNet Peering)"
                e.edge_style = "thick"
        
    # Identity / Credential Theft
    if any("Identity" in name or "Auth" in name or "Token" in name for name in vuln_names):
        nodes["Identity"].node_type = "critical"
        # 2. Credential Theft bypassing network rules
        edges.append(SecurityEdge("Internet", "Identity", "Credential Theft", "dotted"))
        edges.append(SecurityEdge("Identity", "Database", "Privileged Lateral Movement (Contributor)", "thick"))

    # Segment 4: Integrate Threat Intelligence (Azure Sentinel Logic)
    for alert in sentinel_alerts:
        affected = alert.get("AffectedResource")
        if affected in nodes:
            # Update the 'threat_level' property based on alert severity
            nodes[affected].threat_level = alert.get("Severity", "Unknown")
            # Automatically override visual state if it's high severity
            if alert.get("Severity") == "High":
                nodes[affected].node_type = "critical"
                nodes[affected].compromised = True
                # Dynamically create Malicious Traffic edge from Internet
                edges.append(SecurityEdge("Internet", affected, f"Sentinel Alert: {alert.get('AlertName')}", "thick", "TCP", False))
            elif alert.get("Severity") == "Medium" and nodes[affected].node_type != "critical":
                nodes[affected].node_type = "warning"

    return list(nodes.values()), edges

def generate_attack_map(target_url: str, vulnerabilities: List[Dict[str, Any]]) -> str:
    """
    Dynamically generates a Mermaid.js flowchart string based on the Advanced Graph Math.
    """
    # Fetch live threats from Azure Sentinel integration
    sentinel_alerts = fetch_sentinel_alerts()
    nodes, edges = calculate_attack_paths(target_url, vulnerabilities, sentinel_alerts)
    
    mermaid_str = "graph TD\n"
    
    # Render Nodes
    for n in nodes:
        mermaid_str += f'    {n.id}["{n.label}"]\n'
        
    # Render Edges based on edge style
    for e in edges:
        safe_desc = e.description.replace('(', '').replace(')', '').replace('[', '').replace(']', '')
        if e.edge_style == "dotted":
            mermaid_str += f'    {e.source} -.->|{safe_desc}| {e.target}\n'
        elif e.edge_style == "thick":
            mermaid_str += f'    {e.source} ==>|{safe_desc}| {e.target}\n'
        else:
            mermaid_str += f'    {e.source} -->|{safe_desc}| {e.target}\n'
            
    # Define CSS Classes
    mermaid_str += "    classDef secure fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#f8fafc;\n"
    mermaid_str += "    classDef warning fill:#451a03,stroke:#f97316,stroke-width:2px,color:#fed7aa;\n"
    mermaid_str += "    classDef critical fill:#450a0a,stroke:#ef4444,stroke-width:2px,color:#fecaca;\n"

    # Apply CSS and Click Handlers
    for n in nodes:
        mermaid_str += f"    class {n.id} {n.node_type};\n"
        mermaid_str += f'    click {n.id} call handleMermaidClick() "Investigate {n.id}"\n'

    return mermaid_str

def generate_graph_json(target_url: str, vulnerabilities: List[Dict[str, Any]]) -> dict:
    """
    Segment 3: Generates a JSON dictionary representation of the graph for React Flow.
    """
    # Fetch live threats from Azure Sentinel integration
    sentinel_alerts = fetch_sentinel_alerts()
    nodes, edges = calculate_attack_paths(target_url, vulnerabilities, sentinel_alerts)
    
    react_nodes = []
    react_edges = []
    
    for n in nodes:
        react_nodes.append({
            "id": n.id,
            "type": "customSecurityNode",
            "data": {
                "label": n.label,
                "node_type": n.node_type,
                "ip_address": n.ip_address,
                "service_type": n.service_type,
                "compromised": n.compromised,
                "threat_level": n.threat_level
            },
            "position": {"x": 0, "y": 0} # Handled dynamically by Dagre on frontend
        })
        
    for i, e in enumerate(edges):
        react_edges.append({
            "id": f"e_{e.source}_{e.target}_{i}",
            "source": e.source,
            "target": e.target,
            "label": e.description,
            "animated": True if e.edge_style == "dotted" else False,
            "type": "smoothstep",
            "style": { "stroke": "#ef4444" if e.edge_style == "thick" else "#3b82f6", "strokeWidth": 2 if e.edge_style == "thick" else 1 },
            "labelStyle": { "fill": "#cbd5e1", "fontSize": 10, "fontWeight": 500 },
            "labelBgStyle": { "fill": "#0f172a", "color": "#cbd5e1", "stroke": "#1e293b", "strokeWidth": 1 },
            "labelBgPadding": [8, 4],
            "labelBgBorderRadius": 6
        })
        
    return {
        "nodes": react_nodes,
        "edges": react_edges
    }
