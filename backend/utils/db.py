import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Optional: Fallback to SQLite if Azure is not configured yet
try:
    from azure.cosmos import CosmosClient, PartitionKey, exceptions
    AZURE_IMPORTED = True
except ImportError:
    AZURE_IMPORTED = False

load_dotenv()

# We load these from the newly created .env file
ENDPOINT = os.getenv("COSMOS_ENDPOINT", "")
KEY = os.getenv("COSMOS_KEY", "")

DATABASE_NAME = "SentinelGuardDB"
CONTAINER_NAME = "scans"

# Initialize global Cosmos client but allow graceful failure for local dev
client = None
database = None
container = None

def init_db():
    """
    Initializes the Cosmos DB Database and Container if they don't exist.
    Will gracefully fail if connection strings are invalid.
    """
    global client, database, container
    if not AZURE_IMPORTED or not KEY or KEY == "your_primary_key_here":
        print("⚠️ Cosmos DB keys not configured properly in .env. Attempting fallback memory mode.")
        return

    try:
        client = CosmosClient(ENDPOINT, credential=KEY)
        database = client.create_database_if_not_exists(id=DATABASE_NAME)
        container = database.create_container_if_not_exists(
            id=CONTAINER_NAME, 
            partition_key=PartitionKey(path="/target_url")
        )
        print("✅ Successfully connected to Azure Cosmos DB!")
    except exceptions.CosmosHttpResponseError as e:
        print(f"❌ Failed to connect to Azure Cosmos DB: {e.message}")
    except Exception as e:
        print(f"❌ Initialization Error: {str(e)}")

def save_scan_result(target_url: str, score: str, score_percentage: int, vulnerabilities: list, ai_remediation: str = None, mermaid_syntax: str = None, recon_data: dict = None, findings_summary: dict = None, error_log: list = None):
    """
    Saves a completed scan directly into the Azure Cosmos DB cluster.
    Accepts optional `findings_summary` and `error_log` to store analysis metadata.
    """
    timestamp = datetime.utcnow().isoformat() + "Z"
    scan_document = {
        "id": str(uuid.uuid4()),  # Cosmos demands a unique string ID per record
        "target_url": target_url, # Our Partition Key! Very important for NoSQL
        "score": score,
        "score_percentage": score_percentage,
        "vulnerabilities": vulnerabilities,
        "ai_remediation": ai_remediation,
        "mermaid_syntax": mermaid_syntax,
        "recon_data": recon_data or {},
        "findings_summary": findings_summary or {},
        "error_log": error_log or [],
        "timestamp": timestamp
    }

    # If container is not configured, return the generated ID so the app can continue.
    if container is None:
        print("Azure fallback: Scan not saved (No Cosmos DB configured).")
        return scan_document["id"]

    try:
        container.create_item(body=scan_document)
        print(f"Saved {target_url} to Cosmos DB!")
        return scan_document["id"]
    except exceptions.CosmosHttpResponseError as e:
        print(f"Failed to insert into Cosmos DB: {e.message}")
        return scan_document["id"]

def get_scan_history():
    """
    Retrieves all previous scans via Cosmos DB query.
    """
    if container is None:
        return []
        
    # Run a NoSQL query inside Cosmos to get everything ordered by timestamp
    query = "SELECT * FROM c ORDER BY c.timestamp DESC"
    
    items = list(container.query_items(
        query=query,
        enable_cross_partition_query=True
    ))
    
    return items
def get_scan_by_id(scan_id: str):
    """
    Retrieves a single scan document by its unique ID.
    """
    if container is None:
        print("Azure fallback: Cannot retrieve scan (No Cosmos DB configured).")
        return None
        
    query = "SELECT * FROM c WHERE c.id = @scan_id"
    parameters = [{"name": "@scan_id", "value": scan_id}]
    
    items = list(container.query_items(
        query=query,
        parameters=parameters,
        enable_cross_partition_query=True
    ))
    
    return items[0] if items else None
