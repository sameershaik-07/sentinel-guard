from pydantic import BaseModel, HttpUrl
from typing import List, Dict, Optional

class ScanRequest(BaseModel):
    target_url: HttpUrl

class ReconData(BaseModel):
    tech_stack: List[str]
    subdomains: List[str]

class Vulnerability(BaseModel):
    name: str
    severity: str
    fix_snippet: str

class ScanResponse(BaseModel):
    target_url: str
    score: str               # "A", "B", "C", "D", "F"
    score_percentage: int    # 0 to 100
    vulnerabilities: List[Vulnerability]
    ai_remediation: str = None # AI-Powered Remediation
    mermaid_syntax: str      # Dynamic attack topology
    graph_data: dict = None  # Segment 3: React Flow Graph Object
    recon_data: Optional[ReconData] = None # Segment 5: Target Intelligence
    status: str
    message: str
