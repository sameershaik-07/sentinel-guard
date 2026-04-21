import requests
import urllib.parse
from typing import Dict, List

def perform_passive_recon(url: str) -> Dict[str, List[str]]:
    """
    Performs passive reconnaissance (Segment 5) without intrusive scanning.
    1. Tech Stack Fingerprinting (Header analysis)
    2. Crt.sh Integration for hidden subdomains.
    """
    parsed = urllib.parse.urlparse(url)
    domain = parsed.netloc if parsed.netloc else parsed.path
    if ':' in domain:
        domain = domain.split(':')[0]
    
    # Strip www. for crt.sh
    if domain.startswith('www.'):
        domain = domain[4:]

    # 1. Tech Stack Fingerprinting
    stack = []
    try:
        response = requests.get(
            url, 
            timeout=10, 
            verify=False,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'}
        )
        headers = {k.lower(): v.lower() for k, v in response.headers.items()}
        
        # Check standard headers
        if 'x-powered-by' in headers:
            stack.append(response.headers['x-powered-by'])
        if 'server' in headers:
            stack.append(response.headers['server'])
        
        # Heuristics on HTML
        html = response.text.lower()
        if '_next/static' in html or 'next.js' in html:
            stack.append('Next.js')
        elif 'react' in html:
            stack.append('React')
            
        if 'wp-content' in html:
            stack.append('WordPress')
            
        if 'laravel' in html:
            stack.append('Laravel')
            
    except Exception:
        pass

    # Deduplicate and clean
    stack = list(set([s.strip().title() for s in stack if s.strip()]))
    if not stack:
        stack = ["Unknown / Hidden"]

    # 2. Crt.sh Integration for Subdomains (Passive OSINT)
    subdomains = []
    try:
        # crt.sh looks up Certificate Transparency logs
        crt_url = f"https://crt.sh/?q=%.{domain}&output=json"
        crt_res = requests.get(crt_url, timeout=7)
        if crt_res.status_code == 200:
            data = crt_res.json()
            for entry in data:
                name = entry.get('name_value', '')
                if name and not name.startswith('*') and name != domain:
                    subdomains.append(name.split('\n')[0].strip())
        
        # Keep top 5 unique subdomains to avoid UI clutter
        subdomains = list(set(subdomains))[:5]
    except Exception:
        pass

    return {
        "tech_stack": stack,
        "subdomains": subdomains
    }
