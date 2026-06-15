# Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account

### Step 1: Supabase Configuration (2 min)

1. Create project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → New Query
3. Copy-paste contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run"
5. Copy your credentials:
   - Project URL → `SUPABASE_URL`
   - Anon Key → `SUPABASE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - JWT Secret → `SUPABASE_JWT_SECRET`

### Step 2: Backend Setup (1.5 min)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env`:
```
SUPABASE_URL=your-url
SUPABASE_KEY=your-key
SUPABASE_JWT_SECRET=your-secret
```

Start backend:
```bash
uvicorn app.main:app --reload
```

✅ Backend running at `http://localhost:8000`

### Step 3: Frontend Setup (1.5 min)

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start frontend:
```bash
npm run dev
```

✅ Frontend running at `http://localhost:3000`

## Testing the App

### 1. Register Account
- Go to `http://localhost:3000/register`
- Create account with email and password

### 2. Create Trip
- Click "New Trip"
- Fill in:
  - Destination: "Paris" (or any city)
  - Dates: Pick any dates
  - Profile: Choose one (e.g., "Cultural")
- Click "Create Trip"

### 3. Generate Itinerary
- Click "Generate Itinerary" button
- Wait for attractions to load
- View day-by-day itinerary

### 4. View Details
- Click on attractions to see details
- Check distances and times

## Troubleshooting

### Backend won't start
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend shows blank page
```bash
# Check environment variables in .env.local
# Make sure backend is running at http://localhost:8000

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### "Cannot connect to Supabase"
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Check that Supabase project is active
- Ensure network connectivity

### "Invalid credentials" on login
- Verify you registered the account
- Check email and password are correct
- Try registering a new account

## Next Steps

1. **Read Full Documentation**
   - `README.md` - Project overview
   - `DEVELOPMENT.md` - Detailed development guide
   - `SUPABASE_SETUP.md` - Database setup details
   - `DEPLOYMENT.md` - Production deployment

2. **Customize the App**
   - Add more traveler profiles
   - Customize attraction categories
   - Modify UI colors and styling
   - Add more features

3. **Deploy to Production**
   - Follow `DEPLOYMENT.md`
   - Deploy backend to Render
   - Deploy frontend to Vercel
   - Configure production environment variables

## API Documentation

Once backend is running, view interactive API docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Key Files to Know

| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI entry point |
| `backend/app/routes/` | API endpoints |
| `backend/app/services/` | Business logic |
| `frontend/app/page.tsx` | Home page |
| `frontend/app/trips/` | Trip pages |
| `supabase/migrations/` | Database schema |

## Common Commands

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
npm run build
npm run lint

# Database
# Run migrations in Supabase SQL Editor
# Edit schema in supabase/migrations/
```

## Support

- Check `DEVELOPMENT.md` for detailed guides
- Review API docs at `http://localhost:8000/docs`
- Check browser console for frontend errors
- Check terminal for backend errors

---

**You're all set!** 🎉

Start developing and have fun building the Travel Planner app!
