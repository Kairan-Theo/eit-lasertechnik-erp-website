import requests
import json

url = "http://127.0.0.1:8001/api/quotations/"
payload = {
    "qo_code": "QT-TEST-001",
    "created_date": "2023-10-27",
    "customer_name": "Test Company Ltd",
    "items": [
        {
            "item": "1",
            "model": "Model X",
            "description": "Test Item",
            "qty": 2,
            "price": 100.0
        }
    ]
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
