import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv() # Load variables from .env

# Optional: configure Gemini if an API key is present
API_KEY = os.environ.get("GEMINI_API_KEY", "")
if API_KEY and API_KEY != "your_gemini_key_here":
    genai.configure(api_key=API_KEY)

def generate_ai_remediation(url: str, vulnerabilities: list) -> str:
    """Takes a list of vulnerabilities and uses Gemini to generate a context-aware fix snippet."""
    if not vulnerabilities:
        return "No vulnerabilities detected. The target infrastructure appears secure."
        
    if not API_KEY or API_KEY == "your_gemini_key_here":
        return "AI Security Analyst unavailable. Please provide `GEMINI_API_KEY` in the backend environment to unlock context-aware remediations."
        
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        
        prompt = f"""
You are an elite Cloud Security Engineer. We have just completed an automated vulnerability scan against the target URL: {url}

The following vulnerabilities were found during the scan:
{vulnerabilities}
        
Please evaluate these findings and provide context-aware, exact code fixes tailored to these vulnerabilities, rather than generic advice.
Assume this could be a modern web stack (e.g. Next.js, FastAPI, Node.js, etc). Include syntax-highlighted code blocks where appropriate and explain exactly how to remediate these issues. Keep your response professional, precise, and formatted in clear Markdown.
"""
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"AI Remediation evaluation failed: {str(e)}"
