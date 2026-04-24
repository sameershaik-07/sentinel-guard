from fastapi import APIRouter, HTTPException
from typing import List
from models.history import ScanHistoryResponse
from utils.db import get_scan_history, get_scan_by_id

router = APIRouter()

@router.get("/history", response_model=List[ScanHistoryResponse])
async def fetch_history():
    """
    Fetches all previous security scans from the database.
    Used by the Next.js frontend to populate the historical dashboard sidebar.
    """
    history = get_scan_history()
    return history


@router.get("/scan/{scan_id}")
async def fetch_scan(scan_id: str):
    """
    Fetch a single scan document by ID (raw). Used by the fullscreen map route.
    """
    doc = get_scan_by_id(scan_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Scan not found")
    return doc
