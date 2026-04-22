import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()  # Load variables from .env

PLACEHOLDER_KEY = "your_gemini_key_here"


def _load_gemini_api_keys() -> list[str]:
    """Loads Gemini API keys from one or more env var formats."""
    keys: list[str] = []

    # Format 1: comma-separated list (recommended for Railway)
    raw_multi = os.environ.get("GEMINI_API_KEYS", "")
    if raw_multi:
        for key in raw_multi.split(","):
            cleaned = key.strip()
            if cleaned and cleaned != PLACEHOLDER_KEY and cleaned not in keys:
                keys.append(cleaned)

    # Format 2: single key (backward compatible)
    raw_single = os.environ.get("GEMINI_API_KEY", "").strip()
    if raw_single and raw_single != PLACEHOLDER_KEY and raw_single not in keys:
        keys.append(raw_single)

    # Format 3: numbered keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, ...)
    for i in range(1, 21):
        raw_numbered = os.environ.get(f"GEMINI_API_KEY_{i}", "").strip()
        if raw_numbered and raw_numbered != PLACEHOLDER_KEY and raw_numbered not in keys:
            keys.append(raw_numbered)

    return keys


def _is_quota_or_rate_limit_error(exc: Exception) -> bool:
    message = str(exc).lower()
    markers = [
        "resource_exhausted",
        "quota",
        "rate limit",
        "too many requests",
        "429",
    ]
    return any(marker in message for marker in markers)


API_KEYS = _load_gemini_api_keys()
if API_KEYS:
    # Pre-configure once; each request can still rotate keys on failures.
    genai.configure(api_key=API_KEYS[0])

def generate_ai_remediation(url: str, vulnerabilities: list) -> str:
    """Takes a list of vulnerabilities and uses Gemini to generate a context-aware fix snippet."""
    if not vulnerabilities:
        return "No vulnerabilities detected. The target infrastructure appears secure."

    if not API_KEYS:
        return "AI Security Analyst unavailable. Please provide `GEMINI_API_KEY` or `GEMINI_API_KEYS` in the backend environment to unlock context-aware remediations."

    prompt = f"""
You are an elite Cloud Security Engineer. We have just completed an automated vulnerability scan against the target URL: {url}

The following vulnerabilities were found during the scan:
{vulnerabilities}

Please evaluate these findings and provide context-aware, exact code fixes tailored to these vulnerabilities, rather than generic advice.
Assume this could be a modern web stack (e.g. Next.js, FastAPI, Node.js, etc). Include syntax-highlighted code blocks where appropriate and explain exactly how to remediate these issues. Keep your response professional, precise, and formatted in clear Markdown.
"""

    last_error: Exception | None = None
    for idx, api_key in enumerate(API_KEYS):
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-flash-latest")
            response = model.generate_content(prompt)
            response_text = getattr(response, "text", "")
            if response_text:
                return response_text
            return "AI Remediation evaluation failed: Gemini returned an empty response."
        except Exception as exc:
            last_error = exc
            is_last_key = idx == len(API_KEYS) - 1
            if _is_quota_or_rate_limit_error(exc) and not is_last_key:
                continue
            if _is_quota_or_rate_limit_error(exc) and is_last_key:
                return "AI Remediation evaluation failed: All configured Gemini API keys are exhausted or rate-limited."
            return f"AI Remediation evaluation failed: {str(exc)}"

    return f"AI Remediation evaluation failed: {str(last_error) if last_error else 'Unknown Gemini error'}"
