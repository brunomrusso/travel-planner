# Setup de Produção - Checklist Rápido

## 🎯 Ordem de Execução

```
1. SUPABASE (10 min)
   ↓
2. RENDER (15 min)
   ↓
3. VERCEL (10 min)
   ↓
4. TESTES (5 min)
```

---

## 1️⃣ SUPABASE - Banco de Dados

### URLs
- https://supabase.com

### Passos
- [ ] Criar projeto
- [ ] Copiar credenciais (URL, ANON_KEY, JWT_SECRET)
- [ ] Executar migration SQL
- [ ] Configurar autenticação (Email)
- [ ] Adicionar redirect URLs

### Credenciais para Salvar
```
SUPABASE_URL = 
SUPABASE_ANON_KEY = 
SUPABASE_JWT_SECRET = 
```

**Tempo: 10 min**

---

## 2️⃣ RENDER - Backend

### URLs
- https://render.com

### Passos
- [ ] Criar conta (login com GitHub)
- [ ] Conectar repositório GitHub
- [ ] Criar Web Service
- [ ] Configurar:
  - Root Directory: `backend`
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- [ ] Adicionar variáveis de ambiente:
  - SUPABASE_URL
  - SUPABASE_KEY
  - SUPABASE_JWT_SECRET
  - BACKEND_URL (será gerada)
  - FRONTEND_URL (será preenchida depois)
- [ ] Deploy
- [ ] Copiar URL do Render

### Credenciais para Salvar
```
BACKEND_URL = https://travel-planner-api.onrender.com
```

**Tempo: 15 min**

---

## 3️⃣ VERCEL - Frontend

### URLs
- https://vercel.com

### Passos
- [ ] Criar conta (login com GitHub)
- [ ] Importar projeto
- [ ] Configurar:
  - Framework: Next.js
  - Root Directory: `frontend`
- [ ] Adicionar variáveis de ambiente:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - NEXT_PUBLIC_API_URL (use BACKEND_URL do Render)
- [ ] Deploy
- [ ] Copiar URL do Vercel

### Credenciais para Salvar
```
FRONTEND_URL = https://travel-planner.vercel.app
```

**Tempo: 10 min**

---

## 4️⃣ CONFIGURAÇÕES FINAIS

### Atualizar Supabase
- [ ] Authentication → URL Configuration
- [ ] Site URL: `https://seu-dominio.vercel.app`
- [ ] Redirect URLs:
  - `https://seu-dominio.vercel.app/**`
  - `https://travel-planner-api.onrender.com/**`

### Atualizar Render
- [ ] Environment → FRONTEND_URL
- [ ] Valor: `https://seu-dominio.vercel.app`

### Arquivos Locais
- [ ] Criar `backend/.env` com credenciais
- [ ] Criar `frontend/.env.local` com credenciais

**Tempo: 5 min**

---

## ✅ TESTES

### Backend
```bash
curl https://travel-planner-api.onrender.com/health
```
Esperado: `{"status":"healthy"}`

### Frontend
- [ ] Acessar URL do Vercel
- [ ] Página inicial carrega
- [ ] Registrar novo usuário
- [ ] Fazer login
- [ ] Criar trip
- [ ] Gerar itinerário

**Tempo: 5 min**

---

## 📊 RESUMO

| Serviço | Tempo | Status |
|---------|-------|--------|
| Supabase | 10 min | ⏳ |
| Render | 15 min | ⏳ |
| Vercel | 10 min | ⏳ |
| Testes | 5 min | ⏳ |
| **Total** | **40 min** | **⏳** |

---

## 🔗 Links Importantes

- Documentação: `PRODUCTION_SETUP.md`
- GitHub: https://github.com/brunomrusso/travel-planner
- Supabase: https://supabase.com
- Render: https://render.com
- Vercel: https://vercel.com

---

## 💡 Dicas

1. **Salve todas as credenciais** em um arquivo seguro
2. **Não commite** `.env` files
3. **Teste cada etapa** antes de passar para a próxima
4. **Monitore os logs** após deploy
5. **Atualize FRONTEND_URL** no Render após Vercel

---

## 🚀 Você Está Pronto!

Siga `PRODUCTION_SETUP.md` para instruções detalhadas.

**Tempo total: ~40 minutos**

Boa sorte! 🎉
