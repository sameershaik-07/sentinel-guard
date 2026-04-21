from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from utils.db import get_scan_by_id
from utils.pdf_gen import generate_report

router = APIRouter()

@router.get("/report/{scan_id}")
def download_executive_report(scan_id: str):
    """
    Generates a PDF executive summary for a completed scan.
    """
    # Fetch the scan details by ID from Azure Cosmos DB
    scan_data = get_scan_by_id(scan_id)
    if not scan_data:
        raise HTTPException(status_code=404, detail="Scan not found.")
        
    # Generate the PDF blob in memory
    pdf_buffer = generate_report(scan_data)
    
    # Return it as a downloadable file
    target_url = scan_data.get("target_url", "Unknown_Target")
    filename = f"Sentinel_Report_{target_url.replace('http://', '').replace('https://', '')}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )