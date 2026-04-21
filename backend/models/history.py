from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ScanHistoryResponse(BaseModel):
    id: str  # Changed from int to str because Cosmos DB uses string UUIDs
    target_url: str
    score: str
    score_percentage: int
    vulnerabilities: List[Dict[str, Any]]
    timestamp: str
