# Rodar Localmente - Travel Planner

## ✅ Dependências Instaladas!

```
✅ Backend: Python + FastAPI + Supabase
✅ Frontend: Node.js + Next.js + React
```

---

## 📋 Próximos Passos

### 1️⃣ EXECUTAR MIGRATIONS NO SUPABASE (IMPORTANTE!)

**Você precisa fazer isso ANTES de rodar o app!**

#### Passo 1: Copiar SQL

Todo o SQL abaixo deve ser executado no Supabase:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    destination_city TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    traveler_profile TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create attractions table
CREATE TABLE IF NOT EXISTS attractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    osm_id BIGINT,
    name TEXT NOT NULL,
    category TEXT,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    rating FLOAT DEFAULT 0,
    visit_duration_minutes INTEGER DEFAULT 60,
    city TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create itineraries table
CREATE TABLE IF NOT EXISTS itineraries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    attraction_id UUID NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    order_in_day INTEGER NOT NULL,
    start_time TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips(destination_city);
CREATE INDEX IF NOT EXISTS idx_attractions_city ON attractions(city);
CREATE INDEX IF NOT EXISTS idx_attractions_category ON attractions(category);
CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id ON itineraries(trip_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_day ON itineraries(trip_id, day_number);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policies for trips
CREATE POLICY "Users can view own trips" ON trips
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create trips" ON trips
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON trips
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON trips
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for itineraries
CREATE POLICY "Users can view own itineraries" ON itineraries
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM trips WHERE trips.id = itineraries.trip_id)
    );

CREATE POLICY "Users can manage own itineraries" ON itineraries
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM trips WHERE trips.id = itineraries.trip_id)
    );

CREATE POLICY "Users can update own itineraries" ON itineraries
    FOR UPDATE USING (
        auth.uid() = (SELECT user_id FROM trips WHERE trips.id = itineraries.trip_id)
    );

CREATE POLICY "Users can delete own itineraries" ON itineraries
    FOR DELETE USING (
        auth.uid() = (SELECT user_id FROM trips WHERE trips.id = itineraries.trip_id)
    );
```

#### Passo 2: Executar no Supabase

1. Acesse: https://supabase.com
2. Clique no projeto `travel-planner`
3. Menu lateral → **SQL Editor**
4. Clique **"New Query"**
5. Cole todo o SQL acima
6. Clique **"Run"**
7. Aguarde sucesso ✅

---

### 2️⃣ RODAR BACKEND

Abra um **novo PowerShell** e execute:

```powershell
cd "C:\Users\bruno\OneDrive\Documentos\Projetos\travel-planner\backend"
venv\Scripts\activate
uvicorn app.main:app --reload
```

Você verá:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**Teste:** Acesse http://localhost:8000/health

Deve retornar:
```json
{"status":"healthy"}
```

---

### 3️⃣ RODAR FRONTEND

Abra **outro PowerShell** e execute:

```powershell
cd "C:\Users\bruno\OneDrive\Documentos\Projetos\travel-planner\frontend"
npm run dev
```

Você verá:
```
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
```

**Teste:** Acesse http://localhost:3000

---

## 🎯 Checklist de Verificação

### Backend
- [ ] SQL executado no Supabase
- [ ] Backend rodando em http://localhost:8000
- [ ] Health check retorna `{"status":"healthy"}`
- [ ] Logs mostram "Application startup complete"

### Frontend
- [ ] Frontend rodando em http://localhost:3000
- [ ] Página inicial carrega
- [ ] Sem erros no console

### Integração
- [ ] Frontend consegue conectar ao backend
- [ ] Pode fazer login/signup
- [ ] Pode criar trip
- [ ] Pode gerar itinerário

---

## 🧪 Testes Rápidos

### 1. Testar Backend Health

```powershell
curl http://localhost:8000/health
```

Esperado:
```json
{"status":"healthy"}
```

### 2. Testar API Docs

Acesse: http://localhost:8000/docs

Você verá Swagger UI com todos os endpoints

### 3. Testar Frontend

1. Acesse: http://localhost:3000
2. Clique "Sign Up"
3. Registre com email e senha
4. Faça login
5. Vá para "My Trips"
6. Clique "New Trip"
7. Preencha:
   - Destination: Paris
   - Dates: Qualquer data
   - Profile: Cultural
8. Clique "Create Trip"
9. Clique "Generate Itinerary"
10. Veja atrações carregarem

---

## 🔧 Troubleshooting

### "ModuleNotFoundError" no Backend

```powershell
# Certifique-se que venv está ativado
venv\Scripts\activate

# Reinstale dependências
pip install -r requirements.txt
```

### "Cannot find module" no Frontend

```powershell
# Reinstale dependências
npm install

# Limpe cache
npm cache clean --force
npm install
```

### "Connection refused" ao conectar Backend

- Certifique-se que backend está rodando
- Verifique se está em http://localhost:8000
- Verifique variáveis de ambiente em `frontend/.env.local`

### "CORS error"

- Verifique `FRONTEND_URL` em `backend/.env`
- Deve ser `http://localhost:3000`

### "Supabase connection failed"

- Verifique `SUPABASE_URL` em `backend/.env`
- Verifique `SUPABASE_KEY` em `backend/.env`
- Certifique-se que projeto existe no Supabase

---

## 📝 Arquivos Importantes

```
travel-planner/
├── backend/
│   ├── .env (credenciais - criado por setup_env.py)
│   ├── app/
│   │   ├── main.py (entrada FastAPI)
│   │   ├── config.py (configurações)
│   │   ├── database.py (conexão Supabase)
│   │   ├── models/ (modelos de dados)
│   │   ├── routes/ (endpoints)
│   │   └── services/ (lógica de negócio)
│   └── requirements.txt (dependências)
│
├── frontend/
│   ├── .env.local (credenciais - criado por setup_env.py)
│   ├── app/
│   │   ├── page.tsx (página inicial)
│   │   ├── layout.tsx (layout)
│   │   └── (pages)/ (outras páginas)
│   ├── components/ (componentes React)
│   ├── lib/ (utilitários)
│   └── package.json (dependências)
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql (schema do banco)
```

---

## ✅ Próximos Passos

1. ✅ Dependências instaladas
2. ⏳ Executar migrations no Supabase
3. ⏳ Rodar backend
4. ⏳ Rodar frontend
5. ⏳ Testar localmente
6. ⏳ Deploy em produção (Render + Vercel)

---

**Comece com: Executar SQL no Supabase!** 🚀
