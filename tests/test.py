import requests

try:
    response = requests.get('https://example.com')
    print("Requests is working.")
except Exception as e:
    print(f"Failed: {e}")
