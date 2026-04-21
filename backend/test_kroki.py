import base64, zlib, requests
def get_mermaid_svg(md):
    encoded = base64.urlsafe_b64encode(zlib.compress(md.encode('utf-8'))).decode('ascii')
    r = requests.get(f"https://kroki.io/mermaid/svg/{encoded}")
    return r.status_code
print(get_mermaid_svg("graph TD;\nA-->B;"))
