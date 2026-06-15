# Local Development Guide

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- Git
- Supabase account with project created
- Code editor (VS Code recommended)

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/travel-planner.git
cd travel-planner
```

### 2. Backend Setup

#### Create Virtual Environment

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

#### Run Backend

```bash
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

### 3. Frontend Setup

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Run Frontend

```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Development Workflow

### Making Changes

1. **Backend Changes**:
   - Edit files in `backend/app/`
   - Changes auto-reload with `--reload` flag
   - Check API docs at `http://localhost:8000/docs`

2. **Frontend Changes**:
   - Edit files in `frontend/app/` or `frontend/components/`
   - Changes auto-reload with `npm run dev`
   - Check browser console for errors

### Testing API Endpoints

#### Using cURL

```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get trips (replace TOKEN with actual token)
curl -X GET http://localhost:8000/trips/ \
  -H "Authorization: Bearer TOKEN"
```

#### Using Swagger UI

1. Go to `http://localhost:8000/docs`
2. Click "Authorize"
3. Paste your JWT token
4. Try out endpoints

### Database Changes

If you need to modify the database schema:

1. Create a new migration file in `supabase/migrations/`
2. Run it in Supabase SQL Editor
3. Update models in `backend/app/models/` if needed

## Project Structure

```
travel-planner/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Configuration
│   │   ├── database.py          # Supabase connection
│   │   ├── models/              # Pydantic models
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── trips.py
│   │   │   ├── attractions.py
│   │   │   └── itineraries.py
│   │   └── services/            # Business logic
│   │       ├── osm_service.py
│   │       ├── osrm_service.py
│   │       └── itinerary_optimizer.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Home page
│   │   ├── login/               # Login page
│   │   ├── register/            # Register page
│   │   ├── trips/               # Trips listing
│   │   │   ├── page.tsx
│   │   │   ├── new/             # Create trip
│   │   │   └── [id]/            # Trip details
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/              # Reusable components
│   ├── lib/                     # Utilities
│   │   └── supabase.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── .env.local.example
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

## Common Tasks

### Add New API Endpoint

1. Create route in `backend/app/routes/`
2. Add to `backend/app/main.py`:
```python
from app.routes import your_route
app.include_router(your_route.router)
```
3. Test with Swagger UI

### Add New Frontend Page

1. Create file in `frontend/app/your-page/page.tsx`
2. Add navigation link in relevant component
3. Test in browser

### Update Database Schema

1. Create migration in `supabase/migrations/`
2. Run in Supabase SQL Editor
3. Update Pydantic models if needed

### Debug Issues

#### Backend Debugging

```python
# Add print statements
print(f"Debug: {variable}")

# Or use logging
import logging
logger = logging.getLogger(__name__)
logger.info("Debug message")
```

#### Frontend Debugging

```typescript
// Browser console
console.log("Debug:", variable);

// React DevTools extension (recommended)
```

## Performance Tips

1. **Backend**:
   - Use database indexes for frequent queries
   - Cache attraction data in Supabase
   - Implement pagination for large datasets

2. **Frontend**:
   - Use React.memo for expensive components
   - Implement lazy loading for routes
   - Optimize images

## Security Checklist

- [ ] Never commit `.env` files
- [ ] Use environment variables for secrets
- [ ] Validate all user inputs
- [ ] Use HTTPS in production
- [ ] Keep dependencies updated
- [ ] Review Supabase RLS policies

## Useful Commands

```bash
# Backend
pip list                          # List installed packages
pip install -r requirements.txt   # Install dependencies
uvicorn app.main:app --reload    # Run with auto-reload
python -m pytest                 # Run tests (if added)

# Frontend
npm list                         # List installed packages
npm install                      # Install dependencies
npm run dev                      # Development server
npm run build                    # Production build
npm run lint                     # Run linter
```

## Troubleshooting

### "ModuleNotFoundError" in Backend
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### "Cannot find module" in Frontend
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Supabase Connection Issues
- Verify URL and keys in `.env`
- Check network connectivity
- Ensure Supabase project is active

### CORS Errors
- Check `FRONTEND_URL` in backend `.env`
- Verify Supabase CORS settings
- Ensure API calls use correct backend URL

## Next Steps

1. Set up Git hooks (pre-commit linting)
2. Add unit tests
3. Add integration tests
4. Set up CI/CD pipeline
5. Add error tracking (Sentry)
6. Add analytics

## Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
