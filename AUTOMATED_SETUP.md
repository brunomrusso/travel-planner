# Setup Automatizado - Travel Planner

## 🚀 Opção 1: Setup Local (Recomendado Primeiro)

### Passo 1: Execute o Script de Setup

```powershell
cd "C:\Users\bruno\OneDrive\Documentos\Projetos\travel-planner"
python setup_env.py
```

### O que o script faz:

1. ✅ Abre um menu interativo
2. ✅ Pede suas credenciais do Supabase
3. ✅ Valida cada entrada
4. ✅ Cria `backend/.env` automaticamente
5. ✅ Cria `frontend/.env.local` automaticamente
6. ✅ Mostra próximos passos

### Credenciais que você precisa:

Antes de executar, tenha prontas:

1. **Project URL** (Settings → API)
   - Exemplo: `https://xxxxx.supabase.co`

2. **Anon Public Key** (Settings → API)
   - Começa com `eyJ...`

3. **Service Role Secret** (Settings → API)
   - Começa com `eyJ...`

4. **JWT Secret** (Settings → Database)
   - String criptografada

---

## 🌐 Opção 2: Deploy Automático (Depois)

### Para Render (Backend)

```powershell
# 1. Acesse: https://render.com
# 2. Conecte seu GitHub
# 3. Crie novo Web Service
# 4. Selecione: travel-planner
# 5. Configure:
#    - Root Directory: backend
#    - Build: pip install -r requirements.txt
#    - Start: uvicorn app.main:app --host 0.0.0.0 --port 8000
# 6. Adicione Environment Variables:
#    - SUPABASE_URL
#    - SUPABASE_KEY
#    - SUPABASE_JWT_SECRET
#    - BACKEND_URL (será gerada)
#    - FRONTEND_URL
```

### Para Vercel (Frontend)

```powershell
# 1. Acesse: https://vercel.com
# 2. Conecte seu GitHub
# 3. Importe projeto
# 4. Configure:
#    - Root Directory: frontend
# 5. Adicione Environment Variables:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - NEXT_PUBLIC_API_URL
```

---

## 📋 Checklist Rápido

### Local Setup
- [ ] Executei `python setup_env.py`
- [ ] Forneci todas as 4 credenciais
- [ ] Arquivos `.env` foram criados
- [ ] Instalei dependências do backend
- [ ] Instalei dependências do frontend
- [ ] Executei migrations no Supabase
- [ ] Backend rodando em http://localhost:8000
- [ ] Frontend rodando em http://localhost:3000

### Production Setup
- [ ] Projeto criado no Render
- [ ] Projeto criado no Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Backend deployado
- [ ] Frontend deployado
- [ ] URLs atualizadas no Supabase

---

## 🆘 Troubleshooting

### Script não executa
```powershell
# Verifique se Python está instalado
python --version

# Se não estiver, instale de: https://www.python.org
```

### "Campo não pode estar vazio"
- Certifique-se de colar a credencial corretamente
- Use Ctrl+V para colar no PowerShell

### "Chave parece muito curta"
- Você copiou apenas parte da chave
- Copie a chave inteira do Supabase

### Arquivo .env não foi criado
- Verifique permissões da pasta
- Tente executar PowerShell como Administrador

---

## 📝 Próximos Passos Após Setup

### 1. Instalar Dependências

**Backend:**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**
```powershell
cd frontend
npm install
```

### 2. Executar Migrations

1. Acesse: https://supabase.com
2. Projeto → SQL Editor
3. Nova Query
4. Cole: `supabase/migrations/001_initial_schema.sql`
5. Clique "Run"

### 3. Rodar Localmente

**Terminal 1 (Backend):**
```powershell
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

### 4. Testar

- Backend: http://localhost:8000/health
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

---

## 🔐 Segurança

✅ Arquivos `.env` estão no `.gitignore`
✅ Credenciais não serão commitadas
✅ Use variáveis de ambiente em produção
✅ Nunca compartilhe suas chaves

---

## 📞 Resumo

| Etapa | Comando | Tempo |
|-------|---------|-------|
| Setup Local | `python setup_env.py` | 5 min |
| Instalar Deps | `pip install` + `npm install` | 10 min |
| Migrations | Cole SQL no Supabase | 2 min |
| Rodar Local | `uvicorn` + `npm run dev` | 1 min |
| Deploy | Render + Vercel | 20 min |
| **Total** | | **~40 min** |

---

**Comece com: `python setup_env.py`** 🚀
