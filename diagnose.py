#!/usr/bin/env python3
"""Diagnose backend issues"""

import requests
import json

BASE_URL = "http://localhost:8001"

print("🔍 Diagnosticando Travel Planner Backend\n")

# Test 1: Health check
print("1️⃣ Testando /health")
try:
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}\n")
except Exception as e:
    print(f"   ❌ Erro: {e}\n")

# Test 2: Debug endpoint
print("2️⃣ Testando /debug")
try:
    response = requests.get(f"{BASE_URL}/debug")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}\n")
except Exception as e:
    print(f"   ❌ Erro: {e}\n")

# Test 3: Root endpoint
print("3️⃣ Testando /")
try:
    response = requests.get(f"{BASE_URL}/")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}\n")
except Exception as e:
    print(f"   ❌ Erro: {e}\n")

# Test 4: Auth register
print("4️⃣ Testando POST /auth/register")
try:
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={"email": "testuser@example.com", "password": "Test123!@#"}
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   ✅ Registro bem-sucedido!")
        print(f"   Response: {json.dumps(response.json(), indent=2)}\n")
    else:
        print(f"   Response: {response.text[:300]}\n")
except Exception as e:
    print(f"   ❌ Erro: {e}\n")

print("✅ Diagnóstico completo!")
