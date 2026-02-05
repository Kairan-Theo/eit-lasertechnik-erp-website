
import requests
import json

url = "http://127.0.0.1:8002/api/quotations/"

payload = {
    "qo_code": "QUO 2025-0001",
    "customer_name": "Test Customer",
    "items": [
        {"item": "Item 1", "qty": 1, "price": 100}
    ]
}

print(f"Attempting to create quotation with code: {payload['qo_code']}")

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 500:
        import re
        text = response.text
        # Look for exception value
        match = re.search(r'<pre class="exception_value">([^<]+)</pre>', text)
        if match:
            print(f"Exception Value: {match.group(1)}")
        else:
             print("Could not find exception value in HTML")
             print(text[:1000])
    else:
        print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# Try listing again
print("Listing quotations:")
try:
    print(requests.get(url).json())
except:
    print("Failed to list")
