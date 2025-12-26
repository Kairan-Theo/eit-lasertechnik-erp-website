import requests
import json

url = "http://127.0.0.1:8000/api/deals/"
headers = {
    "Authorization": "Token 0322e6ac54a8582aaea3deca8d912d6c1771a85f",
    "Content-Type": "application/json"
}

data = {
    "title": "Test Deal with PO",
    "po_number": "PO-12345",
    "amount": 1000,
    "currency": "฿"
}

print("Creating Deal with PO...")
try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status: {response.status_code}")
    print(response.json())
except Exception as e:
    print(e)
