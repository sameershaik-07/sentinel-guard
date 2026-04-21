from fastapi import APIRouter
from typing import List
from models.history import ScanHistoryResponse
from utils.db import get_scan_history

router = APIRouter()

@router.get("/history", response_model=List[ScanHistoryResponse])
async def fetch_history():
    """
    Fetches all previous security scans from the database.
    Used by the Next.js frontend to populate the historical dashboard sidebar.
    """
    history = get_scan_history()
    return history
