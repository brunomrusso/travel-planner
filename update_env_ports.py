#!/usr/bin/env python3
"""Update environment variables with new ports"""

from pathlib import Path

# Update frontend .env.local
frontend_env = Path("frontend/.env.local")
if frontend_env.exists():
    content = frontend_env.read_text()
    content = content.replace("NEXT_PUBLIC_API_URL=http://localhost:8000", "NEXT_PUBLIC_API_URL=http://localhost:8001")
    frontend_env.write_text(content)
    print("✅ Frontend .env.local atualizado para porta 8001")
else:
    print("❌ Frontend .env.local não encontrado")

# Update backend .env
backend_env = Path("backend/.env")
if backend_env.exists():
    content = backend_env.read_text()
    content = content.replace("BACKEND_URL=http://localhost:8000", "BACKEND_URL=http://localhost:8001")
    backend_env.write_text(content)
    print("✅ Backend .env atualizado para porta 8001")
else:
    print("❌ Backend .env não encontrado")

print("\n✅ Portas atualizadas!")
print("Backend: http://localhost:8001")
print("Frontend: http://localhost:3001")
