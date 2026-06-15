# Configuração de Produção - Guia Completo

## 📋 Ordem Recomendada

1. **Supabase** (banco de dados) - 10 min
2. **Render** (backend) - 15 min
3. **Vercel** (frontend) - 10 min

**Total: ~35 minutos**

---

## 1️⃣ SUPABASE - Banco de Dados

### Passo 1: Criar Projeto

1. Acesse https://supabase.com
2. Clique "Start your project"
3. Faça login com GitHub (recomendado)
4. Clique "New project"
5. Preencha:
   - **Name**: `travel-planner`
   - **Database Password**: Salve em lugar seguro!
   - **Region**: Escolha mais próximo (ex: São Paulo)
6. Clique "Create new project"
7. Aguarde 2-3 minutos

### Passo 2: Copiar Credenciais

Após criado, vá para **Settings → API**:

```
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Vá para **Settings → Database**:

```
JWT_SECRET = sua-jwt-secret-aqui
```

**Salve tudo em um arquivo seguro!**

### Passo 3: Executar Migrations

1. No Supabase, vá para **SQL Editor**
2. Clique "New Query"
3. Copie todo o conteúdo de `supabase/migrations/001_initial_schema.sql`
4. Cole no editor
5. Clique "Run"
6. Aguarde sucesso ✅

### Passo 4: Configurar Autenticação

1. Vá para **Authentication → Providers**
2. Certifique-se que "Email" está habilitado
3. Vá para **Authentication → URL Configuration**
4. Configure:
   - **Site URL**: `http://localhost:3000` (desenvolvimento)
   - **Redirect URLs**: 
     ```
     http://localhost:3000/**
     http://localhost:8000/**
     ```

✅ **Supabase pronto!**

---

## 2️⃣ RENDER - Backend

### Passo 1: Criar Conta

1. Acesse https://render.com
2. Clique "Get Started"
3. Faça login com GitHub

### Passo 2: Conectar Repositório

1. Clique "New +" → "Web Service"
2. Clique "Connect your GitHub account"
3. Autorize Render
4. Selecione repositório: `travel-planner`

### Passo 3: Configurar Serviço

Preencha:

```
Name: travel-planner-api
Environment: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port 8000
Root Directory: backend
```

### Passo 4: Adicionar Variáveis de Ambiente

Clique "Environment" e adicione:

```
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET = sua-jwt-secret
BACKEND_URL = https://travel-planner-api.onrender.com
FRONTEND_URL = https://seu-dominio.vercel.app
```

**Nota**: Você descobrirá a URL do Render após deploy

### Passo 5: Deploy

1. Clique "Create Web Service"
2. Aguarde 2-5 minutos
3. Verá URL como: `https://travel-planner-api.onrender.com`
4. Copie essa URL!

### Passo 6: Testar

```
curl https://travel-planner-api.onrender.com/health
```

Deve retornar: `{"status":"healthy"}`

✅ **Render pronto!**

---

## 3️⃣ VERCEL - Frontend

### Passo 1: Criar Conta

1. Acesse https://vercel.com
2. Clique "Sign Up"
3. Faça login com GitHub

### Passo 2: Importar Projeto

1. Clique "Add New..." → "Project"
2. Selecione repositório: `travel-planner`
3. Clique "Import"

### Passo 3: Configurar Build

Preencha:

```
Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build
Output Directory: .next
```

### Passo 4: Adicionar Variáveis de Ambiente

Clique "Environment Variables" e adicione:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL = https://travel-planner-api.onrender.com
```

### Passo 5: Deploy

1. Clique "Deploy"
2. Aguarde 2-3 minutos
3. Verá URL como: `https://travel-planner.vercel.app`

### Passo 6: Testar

Acesse a URL e verifique se carrega

✅ **Vercel pronto!**

---

## 4️⃣ CONFIGURAÇÕES FINAIS

### Atualizar Supabase

Agora que tem URLs de produção, atualize no Supabase:

1. **Authentication → URL Configuration**
2. Atualize:
   - **Site URL**: `https://seu-dominio.vercel.app`
   - **Redirect URLs**:
     ```
     https://seu-dominio.vercel.app/**
     https://travel-planner-api.onrender.com/**
     ```

### Atualizar Render

Atualize variáveis de ambiente:

```
FRONTEND_URL = https://seu-dominio.vercel.app
```

Render vai fazer redeploy automaticamente

### Atualizar Variáveis Locais

Para desenvolvimento local, crie `.env` files:

**backend/.env**:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=sua-jwt-secret
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

**frontend/.env.local**:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### Supabase
- [ ] Projeto criado
- [ ] Credenciais copiadas
- [ ] Migrations executadas
- [ ] Autenticação configurada
- [ ] URLs de redirect adicionadas

### Render
- [ ] Conta criada
- [ ] Repositório conectado
- [ ] Variáveis de ambiente adicionadas
- [ ] Deploy bem-sucedido
- [ ] Health check funcionando

### Vercel
- [ ] Conta criada
- [ ] Projeto importado
- [ ] Variáveis de ambiente adicionadas
- [ ] Deploy bem-sucedido
- [ ] Site carregando

### Integração
- [ ] Frontend conecta ao backend
- [ ] Backend conecta ao Supabase
- [ ] Autenticação funciona
- [ ] Criação de trip funciona
- [ ] Geração de itinerário funciona

---

## 🧪 TESTES FINAIS

### 1. Testar Backend

```bash
curl https://travel-planner-api.onrender.com/health
```

Esperado: `{"status":"healthy"}`

### 2. Testar Frontend

Acesse: `https://seu-dominio.vercel.app`

Esperado: Página inicial carrega

### 3. Testar Autenticação

1. Clique "Sign Up"
2. Registre com email e senha
3. Faça login
4. Vá para "My Trips"

### 4. Testar Criação de Trip

1. Clique "New Trip"
2. Preencha:
   - Destination: Paris
   - Dates: Qualquer data
   - Profile: Cultural
3. Clique "Create Trip"

### 5. Testar Geração de Itinerário

1. Clique "Generate Itinerary"
2. Aguarde atrações carregarem
3. Veja itinerário por dia

---

## 🔐 SEGURANÇA

### Nunca Commitar

```
.env
.env.local
.env.*.local
```

Já estão no `.gitignore` ✅

### Proteger Secrets

- Nunca compartilhe JWT_SECRET
- Nunca compartilhe SUPABASE_KEY
- Use variáveis de ambiente

### Monitoramento

- Render: Dashboard → Logs
- Vercel: Dashboard → Deployments → Logs
- Supabase: Database → Logs

---

## 💰 CUSTOS

### Free Tier (Recomendado para MVP)
- Render: 750 horas/mês (gratuito)
- Vercel: Unlimited (gratuito)
- Supabase: 500MB storage (gratuito)
- **Total: $0/mês**

### Paid Tier (Scaling)
- Render: $7-12/mês
- Vercel: $20/mês (opcional)
- Supabase: $25/mês
- **Total: ~$32-57/mês**

---

## 🆘 TROUBLESHOOTING

### "Repository not found" no Render
- Verifique se autorizou Render no GitHub
- Reconecte a conta GitHub

### "Build failed" no Render
- Verifique `requirements.txt` está em `backend/`
- Verifique sintaxe Python

### "Build failed" no Vercel
- Verifique `package.json` está em `frontend/`
- Verifique variáveis de ambiente

### "Cannot connect to Supabase"
- Verifique SUPABASE_URL está correto
- Verifique SUPABASE_KEY está correto
- Verifique network connectivity

### "CORS error"
- Verifique FRONTEND_URL no backend
- Verifique redirect URLs no Supabase

---

## 📞 PRÓXIMOS PASSOS

1. ✅ Configurar Supabase
2. ✅ Configurar Render
3. ✅ Configurar Vercel
4. ⏳ Testar em produção
5. ⏳ Monitorar logs
6. ⏳ Otimizar performance

---

**Seu app está pronto para produção!** 🚀
