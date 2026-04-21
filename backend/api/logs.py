from fastapi import APIRouter
from utils.db import get_scan_history
from datetime import datetime

router = APIRouter()

@router.get("/logs")
def get_sentinel_logs():
    """
    Returns real security events (scans from Cosmos DB) formatted as Log entries,
    blended with standard system background noise to look like a live SIEM.
    """
    # 1. Fetch the REAL data from the Azure Cosmos DB you just connected!
    real_scans = get_scan_history()
    
    formatted_logs = []
    
    # 2. Convert real Cosmos DB scan results into "Sentinel Log" format
    for scan in real_scans:
        # Parse timestamp safely (remove Z if present for fromisoformat)
        ts_str = scan.get("timestamp", "").replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(ts_str)
            time_str = dt.strftime("%I:%M:%S %p")
        except ValueError:
            time_str = "Unknown Time"
            
        target = scan.get("target_url", "Unknown Target")
        score = scan.get("score", "F")
        score_pct = scan.get("score_percentage", 0)
        
        # Decide log severity based on the actual score they got
        if score_pct < 50:
            log_type = "critical"
            msg = f"CRITICAL: Remote audit on {target} flagged with SCORE: {score}. Immediate patching required."
        elif score_pct < 80:
            log_type = "warn"
            msg = f"WARNING: Audit on {target} completed with SCORE: {score}. Review security headers."
        else:
            log_type = "secure"
            msg = f"SECURE: Verification passed for {target}. SCORE: {score}."

        formatted_logs.append({
            "id": scan.get("id"),
            "type": log_type,
            "time": time_str,
            "message": msg,
            "is_real": True
        })

    # Return the real database logs (Latest 15)
    return {"logs": formatted_logs[:15]}
