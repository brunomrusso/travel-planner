# Como Encontrar Credenciais no Supabase

## 📍 Localização das Credenciais

### Passo 1: Entrar no Projeto
1. Acesse https://supabase.com
2. Faça login
3. Clique no projeto `travel-planner`

### Passo 2: Ir para Settings → API

**Menu Lateral Esquerdo:**
```
┌─────────────────────────┐
│ Project                 │
│ SQL Editor              │
│ Authentication          │
│ Database                │
│ Storage                 │
│ Realtime                │
│ Vector                  │
│ Functions               │
│ Logs                    │
│ Settings ← CLIQUE AQUI  │
└─────────────────────────┘
```

### Passo 3: Dentro de Settings, Clique em "API"

```
Settings
├── General
├── API ← CLIQUE AQUI
├── Database
├── Auth
└── ...
```

---

## 🔑 Credenciais que Você Vai Ver

### Na página API, procure por:

#### 1. **Project URL**
```
https://xxxxx.supabase.co
```
Copie e salve como: `SUPABASE_URL`

#### 2. **anon public** (Chave Pública)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Copie e salve como: `SUPABASE_ANON_KEY`

#### 3. **service_role secret** (Chave Privada)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Copie e salve como: `SUPABASE_SERVICE_ROLE_KEY`

---

## 🔐 JWT Secret

### Vá para Settings → Database

```
Settings
├── General
├── API
├── Database ← CLIQUE AQUI
├── Auth
└── ...
```

Procure por: **JWT Secret**

Copie e salve como: `SUPABASE_JWT_SECRET`

---

## 📋 Resumo das Credenciais

Você precisa de 4 credenciais:

```
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET = sua-jwt-secret-aqui
```

---

## 💾 Onde Usar Essas Credenciais

### Backend (Render)
```
SUPABASE_URL
SUPABASE_KEY (use SUPABASE_ANON_KEY)
SUPABASE_JWT_SECRET
```

### Frontend (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL (use SUPABASE_URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY (use SUPABASE_ANON_KEY)
```

### Local Development
```
backend/.env
frontend/.env.local
```

---

## ✅ Próximo Passo

Após copiar as credenciais:
1. Vá para SQL Editor
2. Crie nova query
3. Cole o conteúdo de `supabase/migrations/001_initial_schema.sql`
4. Clique "Run"

---

**Dúvidas?** Verifique se está no projeto correto e procure no menu lateral esquerdo.
