# Sentinel-Guard Architectural Blueprint

## 🏛️ High-Level Architecture (3-Tier System)
For development, your app will run on two local servers:
1. **Frontend (Next.js):** Runs on `http://localhost:3000`
2. **Backend (FastAPI):** Runs on `http://localhost:8000`
3. **Database (Mock/CosmosDB):** Accessed internally by the backend.

---

## 🔀 Step-by-Step Data Flow & API Connections

### 1. The Trigger (User Input)
* **Where:** Next.js Client Component (`/src/app/page.tsx`).
* **Action:** The user types a URL (e.g., `https://example.com`) and clicks "Run Audit."
* **Connection:** The React frontend makes an asynchronous HTTP request to the FastAPI backend.
* **API Call:** `POST http://localhost:8000/api/scan`
* **Payload Sent:**
  ```json
  { "target_url": "https://example.com" }
  ```

### 2. The Auditor Engine (Backend Processing)
* **Where:** FastAPI Server (`/backend/main.py`).
* **Action:** The backend receives the request and triggers the scanning modules.
* **Outbound Connections (The Scan):** The Python backend will make real HTTP/TCP requests out to the public internet against the target URL.
  * *Pin 1:* `requests.get()` to check HTTP Security Headers (HSTS, XSS Protection).
  * *Pin 2:* `ssl` and `socket` libraries to read the TLS/SSL Certificate details.
  * *Pin 3 (Mocked for speed):* Simulated open port scan.
* **Logic Calculation:** The backend calculates the **Security Score (A-F)** based on how many checks passed or failed.
* **Mermaid Generation:** Based on the vulnerabilities found, the Python backend dynamically generates a Mermaid.js string (e.g., injecting red color codes if the firewall check fails).

### 3. Database Persistence
* **Where:** FastAPI Server -> Database Layer.
* **Action:** Before returning the data to the user, the backend writes the scan to the database.
* **Connection:** `FastAPI` -> `SQLite` (or a local JSON file for the hackathon MVP, later swapped to Azure Cosmos DB). 

### 4. The Response (Visualizing the Data)
* **Connection:** The FastAPI backend completes the `POST` request and sends a massive JSON payload back to Next.js.
* **Payload Returned:**
  ```json
  {
    "target_url": "https://example.com",
    "score": "C+",
    "score_percentage": 75,
    "vulnerabilities": [
      {
        "name": "Missing Strict-Transport-Security Header",
        "severity": "High",
        "fix_snippet": "Add 'Strict-Transport-Security: max-age=31536000' to your server output."
      }
    ],
    "mermaid_syntax": "graph TD;\n Internet-->|Insecure| WebServer;\n classDef red fill:#f87171;"
  }
  ```

### 5. The Dashboard Render (Frontend Display)
* **Where:** Next.js UI Components.
* **Action:** It parses the JSON payload.
  * *Component A:* Reads `score_percentage` and animates a circular progress bar.
  * *Component B:* Feeds `mermaid_syntax` directly into the `react-mermaid2` component to draw the Attack Map.
  * *Component C:* Maps through the `vulnerabilities` array to render "How to Fix" cards.

---

## 🔌 Complete API Route Specification
We will build exactly two API routes in FastAPI to fulfill the MVP:

1. **`POST /api/scan`** 
   * **Purpose:** Runs a live security audit on a URL.
   * **Input:** Target URL.
   * **Output:** Score, Vulnerabilities, Mermaid Map syntax, and Remediation advice.

2. **`GET /api/history`**
   * **Purpose:** Fetches previous scans to populate the sidebar/dashboard history.
   * **Input:** None (or a user ID/Session ID).
   * **Output:** Array of past scan results `[ { url: "example.com", score: "A" }, ... ]`.

---

## 💡 Additional Information & Hackathon Recommendations

* **Handling CORS (Cross-Origin Resource Sharing):** Because Next.js runs on Port 3000 and FastAPI runs on Port 8000, the browser will block requests by default. We already fixed this in *Step 1.2* by adding `CORSMiddleware` in `main.py`!
* **The "30-Second Timeout" Rule:** Network scanning is slow. Browsers often give up (timeout) if an API request takes longer than 30-60 seconds. For the hackathon demo, we must configure our Python `requests` to have a strict timeout (e.g., `timeout=5` seconds per check) so the demo doesn't freeze helplessly if it hits a slow website.
* **Frontend Scanning is Impossible:** You cannot run `nmap` or check deep SSL cert details from JavaScript inside a web browser (due to browser security sandboxes). That is exactly why we *must* route the URL to our Python backend, have Python do the "hacking," and send the results back to Next.js.