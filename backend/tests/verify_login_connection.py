"""
Test script to verify FastAPI backend health and login endpoints
from localhost and LAN IP.
"""
import requests
import json

lan_url = 'http://10.68.42.91:8001'
local_url = 'http://127.0.0.1:8001'

print("=" * 60)
print("VERIFYING BACKEND CONNECTIVITY AND AUTHENTICATION")
print("=" * 60)

# 1. Health check on LAN & Localhost
for base in [local_url, lan_url]:
    try:
        r = requests.get(f"{base}/health", timeout=5)
        print(f"[HEALTH] {base}/health -> HTTP {r.status_code}: {r.json()}")
    except Exception as e:
        print(f"[HEALTH] {base}/health -> FAILED: {e}")

# 2. Officer Login
try:
    payload = {
        "username": "OFF-8842",
        "password": "Password@123",
        "role": "OFFICER"
    }
    r = requests.post(f"{lan_url}/api/auth/login", json=payload, timeout=5)
    print(f"\n[OFFICER LOGIN] HTTP {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"  Token Type: {data.get('token_type')}")
        print(f"  User Role: {data.get('user', {}).get('role')}")
        print(f"  User Name: {data.get('user', {}).get('name')}")
        print(f"  JWT Token Issued: {bool(data.get('access_token'))}")
    else:
        print(f"  Response: {r.text}")
except Exception as e:
    print(f"[OFFICER LOGIN] FAILED: {e}")

# 3. Supervisor Login
try:
    payload = {
        "username": "SUP-1090",
        "password": "Password@123",
        "role": "SUPERVISOR"
    }
    r = requests.post(f"{lan_url}/api/auth/login", json=payload, timeout=5)
    print(f"\n[SUPERVISOR LOGIN] HTTP {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"  Token Type: {data.get('token_type')}")
        print(f"  User Role: {data.get('user', {}).get('role')}")
        print(f"  User Name: {data.get('user', {}).get('name')}")
        print(f"  JWT Token Issued: {bool(data.get('access_token'))}")
    else:
        print(f"  Response: {r.text}")
except Exception as e:
    print(f"[SUPERVISOR LOGIN] FAILED: {e}")

# 4. Role Mismatch (Officer account trying to log in as Supervisor)
try:
    payload = {
        "username": "OFF-8842",
        "password": "Password@123",
        "role": "SUPERVISOR"
    }
    r = requests.post(f"{lan_url}/api/auth/login", json=payload, timeout=5)
    print(f"\n[ROLE MISMATCH TEST] HTTP {r.status_code} (Expected 403)")
    print(f"  Detail: {r.json().get('detail')}")
except Exception as e:
    print(f"[ROLE MISMATCH TEST] FAILED: {e}")

# 5. Invalid Password
try:
    payload = {
        "username": "OFF-2024-001",
        "password": "WrongPassword123!",
        "role": "OFFICER"
    }
    r = requests.post(f"{lan_url}/api/auth/login", json=payload, timeout=5)
    print(f"\n[INVALID CREDENTIALS TEST] HTTP {r.status_code} (Expected 401)")
    print(f"  Detail: {r.json().get('detail')}")
except Exception as e:
    print(f"[INVALID CREDENTIALS TEST] FAILED: {e}")

print("\n" + "=" * 60)
print("ALL BACKEND AUTHENTICATION CHECKS COMPLETE")
print("=" * 60)
