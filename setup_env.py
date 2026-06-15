#!/usr/bin/env python3
"""
Setup automático de variáveis de ambiente para Travel Planner
Execute: python setup_env.py
"""

import os
import sys
from pathlib import Path

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60 + "\n")

def print_section(text):
    print(f"\n>>> {text}")
    print("-" * 60)

def get_input_with_validation(prompt, is_url=False, is_secret=False):
    """Get input from user with validation"""
    while True:
        value = input(prompt).strip()
        
        if not value:
            print("❌ Campo não pode estar vazio!")
            continue
        
        if is_url and not value.startswith("https://"):
            print("❌ URL deve começar com https://")
            continue
        
        if is_secret and len(value) < 20:
            print("❌ Chave parece muito curta. Verifique se copiou corretamente.")
            continue
        
        return value

def create_env_file(filepath, credentials):
    """Create .env file with credentials"""
    content = "\n".join([f"{key}={value}" for key, value in credentials.items()])
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"✅ Arquivo criado: {filepath}")

def main():
    clear_screen()
    print_header("SETUP AUTOMÁTICO - TRAVEL PLANNER")
    
    print("""
    Este script vai configurar automaticamente suas credenciais do Supabase.
    
    Você precisa ter:
    1. Projeto criado no Supabase (https://supabase.com)
    2. Credenciais copiadas (veja instruções abaixo)
    
    Pressione ENTER para continuar...
    """)
    input()
    
    # Instruções para encontrar credenciais
    clear_screen()
    print_header("COMO ENCONTRAR SUAS CREDENCIAIS")
    
    print("""
    1. Acesse: https://supabase.com
    2. Faça login
    3. Clique no projeto "travel-planner"
    4. No menu lateral ESQUERDO, clique em "Settings"
    5. Clique em "API"
    
    Você verá:
    ┌─────────────────────────────────────────────────────┐
    │ Project URL: https://xxxxx.supabase.co              │
    │ anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │
    │ service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI... │
    └─────────────────────────────────────────────────────┘
    
    Depois, vá para:
    6. Settings → Database
    7. Procure por "JWT Secret"
    
    Copie cada um e cole aqui quando pedir.
    
    Pressione ENTER quando estiver pronto...
    """)
    input()
    
    # Coletar credenciais
    clear_screen()
    print_header("COLE SUAS CREDENCIAIS")
    
    print("\n📌 Dica: Use Ctrl+V para colar no PowerShell\n")
    
    credentials = {}
    
    print_section("1. Project URL")
    print("Copie de: Settings → API → Project URL")
    print("Exemplo: https://xxxxx.supabase.co\n")
    credentials['SUPABASE_URL'] = get_input_with_validation(
        "Cole a URL: ", 
        is_url=True
    )
    
    print_section("2. Anon Public Key")
    print("Copie de: Settings → API → anon public")
    print("É uma string longa começando com 'eyJ...'\n")
    credentials['SUPABASE_ANON_KEY'] = get_input_with_validation(
        "Cole a chave: ",
        is_secret=True
    )
    
    print_section("3. Service Role Secret")
    print("Copie de: Settings → API → service_role secret")
    print("É uma string longa começando com 'eyJ...'\n")
    credentials['SUPABASE_SERVICE_ROLE_KEY'] = get_input_with_validation(
        "Cole a chave: ",
        is_secret=True
    )
    
    print_section("4. JWT Secret")
    print("Copie de: Settings → Database → JWT Secret")
    print("É uma string criptografada\n")
    credentials['SUPABASE_JWT_SECRET'] = get_input_with_validation(
        "Cole o secret: ",
        is_secret=True
    )
    
    # Credenciais adicionais
    print_section("5. URLs de Produção (opcional)")
    print("Deixe em branco se ainda não tem URLs de produção")
    print("Você pode atualizar depois.\n")
    
    backend_url = input("URL do Backend (ou pressione ENTER): ").strip()
    if not backend_url:
        backend_url = "http://localhost:8000"
    credentials['BACKEND_URL'] = backend_url
    
    frontend_url = input("URL do Frontend (ou pressione ENTER): ").strip()
    if not frontend_url:
        frontend_url = "http://localhost:3000"
    credentials['FRONTEND_URL'] = frontend_url
    
    # Criar arquivos .env
    clear_screen()
    print_header("CRIANDO ARQUIVOS DE CONFIGURAÇÃO")
    
    project_root = Path(__file__).parent
    
    # Backend .env
    print_section("Configurando Backend")
    backend_env = {
        'SUPABASE_URL': credentials['SUPABASE_URL'],
        'SUPABASE_KEY': credentials['SUPABASE_ANON_KEY'],
        'SUPABASE_JWT_SECRET': credentials['SUPABASE_JWT_SECRET'],
        'BACKEND_URL': credentials['BACKEND_URL'],
        'FRONTEND_URL': credentials['FRONTEND_URL'],
    }
    
    backend_path = project_root / 'backend' / '.env'
    create_env_file(backend_path, backend_env)
    
    # Frontend .env.local
    print_section("Configurando Frontend")
    frontend_env = {
        'NEXT_PUBLIC_SUPABASE_URL': credentials['SUPABASE_URL'],
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': credentials['SUPABASE_ANON_KEY'],
        'NEXT_PUBLIC_API_URL': credentials['BACKEND_URL'],
    }
    
    frontend_path = project_root / 'frontend' / '.env.local'
    create_env_file(frontend_path, frontend_env)
    
    # Resumo
    clear_screen()
    print_header("✅ CONFIGURAÇÃO COMPLETA!")
    
    print(f"""
    Arquivos criados com sucesso:
    
    ✅ {backend_path}
    ✅ {frontend_path}
    
    Próximos passos:
    
    1. INSTALAR DEPENDÊNCIAS
       Backend:
       cd backend
       python -m venv venv
       venv\\Scripts\\activate
       pip install -r requirements.txt
       
       Frontend:
       cd frontend
       npm install
    
    2. EXECUTAR MIGRATIONS NO SUPABASE
       - Acesse: https://supabase.com
       - Vá para SQL Editor
       - Crie nova query
       - Cole conteúdo de: supabase/migrations/001_initial_schema.sql
       - Clique "Run"
    
    3. RODAR LOCALMENTE
       Backend:
       uvicorn app.main:app --reload
       
       Frontend:
       npm run dev
    
    4. TESTAR
       - Backend: http://localhost:8000/health
       - Frontend: http://localhost:3000
    
    📝 Nota: Os arquivos .env estão no .gitignore (não serão commitados)
    
    Pressione ENTER para sair...
    """)
    input()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelado pelo usuário.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        sys.exit(1)
