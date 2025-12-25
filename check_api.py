import requests
import json

url = "http://127.0.0.1:8000/api/deals/"
headers = {
    "Authorization": "Token 0322e6ac54a8582aaea3deca8d912d6c1771a85f"
}

print("\n--- TEST 1: No Headers ---")
try:
    response = requests.get(url)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Items: {len(data)}")
    else:
        # print(response.text)
        # print("Response Text (First 4000 chars):", response.text[:4000])
        # Find exception value
        if "pre.exception_value" in response.text:
            start = response.text.find('<pre class="exception_value">')
            if start != -1:
                end = response.text.find('</pre>', start)
                print("EXCEPTION:", response.text[start:end])
        else:
             print("Response Text (First 1000 chars):", response.text[:1000])
except Exception as e:
    print(e)

print("\n--- TEST 2: With Header ---")
try:
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Items: {len(data)}")
    else:
        # print(response.text)
        print("Response Text (First 2000 chars):", response.text[:2000])
except Exception as e:
    print(e)
