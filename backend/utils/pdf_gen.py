import io
import re
import base64
import zlib
import requests
import markdown
from datetime import datetime
from weasyprint import HTML

def markdown_to_html(text: str) -> str:
    if not isinstance(text, str):
        return str(text)
    
    # Use the robust markdown library
    # Enable extensions to support things like tables and fenced code blocks
    return markdown.markdown(text, extensions=['fenced_code', 'tables'])

def get_kroki_png(mermaid_str: str) -> str:
    try:
        encoded_str = base64.urlsafe_b64encode(zlib.compress(mermaid_str.encode('utf-8'))).decode('ascii')
        resp = requests.get(f"https://kroki.io/mermaid/png/{encoded_str}", timeout=10)
        if resp.status_code == 200:
            b64_img = base64.b64encode(resp.content).decode('ascii')
            return f"<img src='data:image/png;base64,{b64_img}' style='max-width:100%; height:auto;' />"
    except Exception as e:
        print(f"Kroki error: {e}")
    return "<div class='error-box'>[!] DIAGRAM RENDER FAILURE - SECURE TUNNEL ABORTED</div>"

def generate_report(scan_data: dict) -> io.BytesIO:
    target_url = scan_data.get("target_url", "https://unknown.target")
    score = scan_data.get("score", "X")
    score_pct = scan_data.get("score_percentage", 0)
    vulns = scan_data.get("vulnerabilities", [])
    if isinstance(vulns, list) and len(vulns) > 0 and hasattr(vulns[0], 'model_dump'):
        vulns = [v.model_dump() for v in vulns]
    elif isinstance(vulns, list) and len(vulns) > 0 and hasattr(vulns[0], '__dict__'):
        vulns = [v.__dict__ for v in vulns]

    ai_remediation = scan_data.get("ai_remediation", "No advanced insights available at this time.")
    mermaid_syntax = scan_data.get("mermaid_syntax", "graph TD\nLocal-->Firewall\nFirewall-->Internet")
    recon_data = scan_data.get("recon_data", {})
    if hasattr(recon_data, "model_dump"):
        recon_data = recon_data.model_dump()
    elif hasattr(recon_data, "__dict__"):
        recon_data = recon_data.__dict__
    
    tech_stack = recon_data.get("tech_stack", []) if isinstance(recon_data, dict) else []
    subdomains = recon_data.get("subdomains", []) if isinstance(recon_data, dict) else []
    
    scan_date = datetime.utcnow().strftime("%B %d, %Y - %H:%M:%S UTC")
    
    # Overrides for specific score styling
    score_color = "#10B981" if score in ["A","B"] else ("#F59E0B" if score == "C" else "#EF4444")
    
    # Inject Dark Theme Configuration into the Mermaid Syntax before sending to Kroki
    if "%%{init:" not in mermaid_syntax:
        mermaid_syntax = "%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#1E293B', 'primaryColor': '#334155', 'primaryTextColor': '#F8FAFC', 'primaryBorderColor': '#3B82F6', 'lineColor': '#94A3B8', 'tertiaryColor': '#0F172A'}}}%%\n" + mermaid_syntax

    # Hack the SVG out of Kroki
    graph_svg = get_kroki_png(mermaid_syntax)

    # Make sure text converts correctly for vulnerabilities too
    vuln_html = ""
    if not vulns:
        vuln_html = "<div class='vuln-card'><p style='color:#10B981; padding: 15px'>✓ No vulnerabilities detected. Systems secure.</p></div>"
    else:
        for idx, v in enumerate(vulns):
            title = v.get("name", "Unknown Threat")
            sev = v.get("severity", "LOW").upper()
            rem = v.get("fix_snippet", "No remediation snippet available.")
            
            sev_class = "severity-critical" if sev in ["HIGH", "CRITICAL"] else ("severity-medium" if sev == "MEDIUM" else "severity-low")
            
            vuln_html += f"""
            <div class="vuln-card">
                <div class="vuln-header {sev_class}">
                    <span class="vuln-title">{title}</span>
                    <span class="vuln-id">#{idx+1}</span>
                </div>
                <div class="vuln-body">
                    <p class="section-label">Impact Analysis:</p>
                    <p class="text-muted">Potential exposure identified in {target_url} infrastructure causing a {sev} risk.</p>
                    <p class="section-label mt-10">Remediation Steps:</p>
                    <div class="remediation-box">{markdown_to_html(rem)}</div>
                </div>
            </div>
            """
            
    # Subdomains and Tech HTML
    tech_str = ", ".join(tech_stack) if tech_stack else "None Detected"
    sub_html = "".join([f"<tr><td>Domain</td><td>{s}</td><td>Active</td></tr>" for s in subdomains])
    if not sub_html:
        sub_html = "<tr><td>-</td><td>No subdomains found</td><td>-</td></tr>"

    status_color = "text-red" if score in ["D","F"] else "text-green"
    status_text = "AT RISK" if score in ["D","F"] else "SECURE"

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Sentinel-Guard Executive Report</title>
        <style>
            @page {{
                size: A4 portrait;
                margin: 20mm;
                @bottom-right {{
                    content: "Page " counter(page) " of " counter(pages);
                    color: #94A3B8;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    font-size: 8pt;
                }}
                @bottom-left {{
                    content: "CONFIDENTIAL // SENTINEL-GUARD REPORT";
                    color: #94A3B8;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    font-size: 8pt;
                }}
            }}
            body {{
                background-color: #0F172A;
                color: #E2E8F0;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 10pt;
                line-height: 1.5;
                margin: 0;
                padding: 0;
            }}
            h1, h2, h3, h4 {{
                font-weight: 600;
                margin-top: 0;
                color: #F8FAFC;
                letter-spacing: 0.5px;
            }}
            .text-green {{ color: #10B981; }}
            .text-red {{ color: #EF4444; }}
            .text-blue {{ color: #3B82F6; }}
            .text-muted {{ color: #94A3B8; }}
            
            /* Segment 1: Header */
            .header-box {{
                border-left: 4px solid #3B82F6;
                background-color: #1E293B;
                padding: 20px;
                margin-bottom: 30px;
                border-radius: 4px;
            }}
            .header-title {{
                color: #F8FAFC;
                font-size: 20pt;
                margin-bottom: 5px;
                font-weight: 700;
            }}
            .header-subtitle {{
                font-size: 9pt;
                color: #94A3B8;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}

            /* Segment 2: Executive Scoreboard */
            .scoreboard {{
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                margin-bottom: 30px;
                background-color: #1E293B;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid #334155;
            }}
            .scoreboard td {{
                padding: 20px;
                vertical-align: top;
            }}
            .score-grade {{
                width: 25%;
                text-align: center;
                border-right: 1px solid #334155;
                background-color: #162032;
            }}
            .score-letter {{
                font-size: 48pt;
                line-height: 1.1;
                margin: 10px 0;
                font-weight: 700;
                color: {score_color};
            }}
            .score-details {{
                width: 75%;
            }}
            .detail-row {{
                margin-bottom: 12px;
                font-size: 11pt;
            }}
            .label {{ color: #94A3B8; display: inline-block; width: 140px; font-weight: 500; }}

            /* Segment 6: AI Analytics */
            .analytics-window {{
                border: 1px solid #334155;
                background-color: #1E293B;
                margin-bottom: 30px;
                border-radius: 8px;
                overflow: hidden;
            }}
            .analytics-header {{
                background-color: #273447;
                border-bottom: 1px solid #334155;
                color: #E2E8F0;
                padding: 10px 15px;
                font-weight: 600;
                font-size: 9pt;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}
            .analytics-body {{
                padding: 20px;
                font-size: 10pt;
                color: #CBD5E1;
                line-height: 1.6;
            }}

            /* Section Titles */
            .section-title {{
                color: #F8FAFC;
                border-bottom: 2px solid #334155;
                padding-bottom: 8px;
                margin-bottom: 20px;
                margin-top: 40px;
                page-break-after: avoid;
                font-weight: 600;
                font-size: 14pt;
                letter-spacing: 0.5px;
            }}

            /* Segment 4: Target Intelligence Details */
            table.osint-table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }}
            table.osint-table th, table.osint-table td {{
                border-bottom: 1px solid #334155;
                padding: 12px 16px;
                text-align: left;
                font-size: 9.5pt;
            }}
            table.osint-table th {{
                background-color: #1E293B;
                color: #94A3B8;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}

            /* Segment 5: Vulnerabilities */
            .vuln-card {{
                border: 1px solid #334155;
                background-color: #1E293B;
                margin-bottom: 20px;
                border-radius: 8px;
                overflow: hidden;
                page-break-inside: avoid;
            }}
            .vuln-header {{
                padding: 12px 16px;
                font-weight: 600;
            }}
            .vuln-id {{ 
                font-size: 9pt; 
                opacity: 0.8;
                background: rgba(0,0,0,0.2);
                padding: 2px 8px;
                border-radius: 12px;
                float: right;
            }}
            .vuln-title {{ font-size: 11pt; }}
            
            .severity-critical {{ background-color: #451A1E; color: #FCA5A5; border-bottom: 1px solid #7F1D1D; }}
            .severity-medium {{ background-color: #422006; color: #FCD34D; border-bottom: 1px solid #78350F; }}
            .severity-low {{ background-color: #172554; color: #93C5FD; border-bottom: 1px solid #1E3A8A; }}

            .vuln-body {{
                padding: 20px;
            }}
            .section-label {{
                color: #94A3B8;
                font-size: 9pt;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 8px;
                margin-top: 0;
                letter-spacing: 0.5px;
            }}
            .remediation-box {{
                background-color: #0F172A;
                border: 1px solid #334155;
                border-left: 3px solid #3B82F6;
                padding: 12px;
                border-radius: 4px;
                font-family: inherit;
                font-size: 9.5pt;
                color: #CBD5E1;
            }}
            .remediation-box pre {{
                background-color: #1E293B;
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
            }}
            .remediation-box code {{
                font-family: 'Courier New', Courier, monospace;
            }}
            .mt-10 {{ margin-top: 15px; }}

            /* Attack Surface Container */
            .attack-map-container {{
                background-color: #1E293B; 
                border: 1px solid #334155;
                padding: 20px;
                text-align: center;
                margin-top: 20px;
                margin-bottom: 20px;
                border-radius: 8px;
                page-break-inside: avoid;
            }}
            .attack-map-container svg {{
                max-width: 100%;
                height: auto;
                background-color: #1E293B;
            }}
            .attack-map-container .label {{
                color: #F8FAFC !important;
            }}
            .attack-map-container text {{
                fill: #F8FAFC !important;
            }}

            /* Analytics formatting */
            .analytics-body h1, .analytics-body h2, .analytics-body h3 {{
                color: #F8FAFC;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                border-bottom: 1px solid #334155;
                padding-bottom: 5px;
            }}
            .analytics-body p {{
                margin-bottom: 1em;
            }}
            .analytics-body ul, .analytics-body ol {{
                margin-bottom: 1em;
                padding-left: 20px;
            }}
            .analytics-body pre {{
                background-color: #0F172A;
                padding: 15px;
                border: 1px solid #334155;
                border-radius: 6px;
                overflow-x: auto;
            }}
            .analytics-body code {{
                font-family: 'Courier New', Courier, monospace;
                font-size: 9pt;
            }}

        </style>
    </head>
    <body>

        <!-- Segment 1: Header -->
        <div class="header-box">
            <div class="header-title">Security Assessment Report</div>
            <div class="header-subtitle">Generated by Sentinel-Guard | Analytics & Diagnostics</div>
        </div>

        <!-- Segment 2: Scoreboard -->
        <table class="scoreboard" cellspacing="0" cellpadding="0">
            <tr>
                <td class="score-grade">
                    <div style="color: #94A3B8; font-size: 9pt; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Security Score</div>
                    <div class="score-letter">{score}</div>
                    <div style="color: #64748B; font-size: 8.5pt;">{score_pct}/100 EVALUATION</div>
                </td>
                <td class="score-details">
                    <div class="detail-row">
                        <span class="label">Target Asset:</span> <span class="text-blue" style="font-weight: 600;">{target_url}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Scan Date:</span> <span style="color: #CBD5E1;">{scan_date}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Status:</span> <span class="{status_color}" style="font-weight: 600;">{status_text}</span>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Segment 6: AI Analytics -->
        <div class="analytics-window">
            <div class="analytics-header">AI Analyst Insights & Recommendations</div>
            <div class="analytics-body">
                {markdown_to_html(ai_remediation)}
            </div>
        </div>

        <!-- Segment 4: Target Intelligence -->
        <div class="section-title">Target Intelligence (OSINT)</div>
        <table class="osint-table">
            <tr>
                <th>Identifier</th>
                <th>Value</th>
                <th>Remarks</th>
            </tr>
            <tr>
                <td>Tech Stack</td>
                <td>{tech_str}</td>
                <td>Fingerprinted via headers</td>
            </tr>
            {sub_html}
        </table>

        <!-- Segment 5: Vulnerability Deep-Dive -->
        <div class="section-title" style="page-break-before: always;">Vulnerability Details</div>
        {vuln_html}

        <!-- Segment 3: Attack Surface Visualization -->
        <div class="section-title" style="page-break-before: always;">Interactive Attack Surface</div>
        <div class="attack-map-container">
            {graph_svg}
        </div>

    </body>
    </html>
    """

    # Generate PDF via WeasyPrint
    pdf_buffer = io.BytesIO()
    HTML(string=html_content).write_pdf(target=pdf_buffer)
    pdf_buffer.seek(0)
    
    return pdf_buffer
