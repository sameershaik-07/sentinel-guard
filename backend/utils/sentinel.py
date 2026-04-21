import os
from typing import List, Dict, Any
from azure.identity import DefaultAzureCredential
from azure.mgmt.securityinsight import SecurityInsights

def fetch_sentinel_alerts() -> List[Dict[str, Any]]:
    """
    Segment 4: Integrating Threat Intelligence (Azure Sentinel)
    Fetches real-world security incidents from Microsoft Sentinel and maps them to our local nodes.
    """
    subscription_id = os.environ.get("AZURE_SUBSCRIPTION_ID", "")
    resource_group = os.environ.get("AZURE_RESOURCE_GROUP", "")
    workspace_name = os.environ.get("AZURE_WORKSPACE_NAME", "")
    
    if not subscription_id or not resource_group or not workspace_name:
        print("Sentinel Config Error: Missing AZURE_SUBSCRIPTION_ID, AZURE_RESOURCE_GROUP, or AZURE_WORKSPACE_NAME")
        return []
        
    try:
        credential = DefaultAzureCredential(exclude_interactive_browser_credential=True)
        client = SecurityInsights(credential, subscription_id)
        
        # Fetch actual incidents from Azure Sentinel
        incidents = client.incidents.list(resource_group, workspace_name)
        
        alerts = []
        for inc in incidents:
            # Basic mapping logic: extract the first word or known node ID from the incident title/description
            # In a full PROD app, you'd map entity IDs (like IP or Hostname) directly to the Graph Nodes
            mapped_resource = "Unknown"
            if inc.title:
                if "AppServer" in inc.title or "Web" in inc.title:
                    mapped_resource = "AppServerA"
                elif "Identity" in inc.title or "Sign-in" in inc.title or "AD" in inc.title:
                    mapped_resource = "Identity"
                elif "Database" in inc.title or "SQL" in inc.title:
                    mapped_resource = "Database"
            
            alerts.append({
                "SystemAlertId": inc.name,
                "AlertName": inc.title,
                "Severity": inc.severity,
                "Status": str(inc.status),
                "AffectedResource": mapped_resource
            })
            
        print(f"✅ Fetched {len(alerts)} live incidents from Microsoft Sentinel.")
        return alerts
        
    except Exception as e:
        print(f"❌ Sentinel API Error: {str(e)}")
        
    return []
