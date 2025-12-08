import requests
import json

url = "http://localhost:3002/api/auth/login"
data = {
    "email": "admin@company.com",
    "password": "admin123"
}

headers = {
    "Content-Type": "application/json"
}

print("Testing login to:", url)
print("Data:", data)

response = requests.post(url, data=json.dumps(data), headers=headers)

print("Status code:", response.status_code)
print("Response headers:", response.headers)
print("Response body:", response.text)