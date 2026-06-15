# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - Name: `travel-planner`
   - Database Password: (save this securely)
   - Region: Choose closest to you
5. Wait for project to be created

## Step 2: Get API Keys

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_KEY` (frontend) and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_KEY` (backend)
3. Go to Project Settings → Database
4. Copy **JWT Secret** → `SUPABASE_JWT_SECRET`

## Step 3: Run Database Migrations

1. In Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run"
6. Wait for success message

## Step 4: Configure Authentication

1. Go to Authentication → Providers
2. Ensure "Email" is enabled (should be by default)
3. Go to Authentication → URL Configuration
4. Set **Site URL**:
   - Development: `http://localhost:3000`
   - Production: `https://your-vercel-domain.com`
5. Add **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://your-vercel-domain.com/**`

## Step 5: Update Environment Files

### Backend (.env)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-here
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Step 6: Test Connection

1. Start backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. Test health endpoint:
   ```bash
   curl http://localhost:8000/health
   ```

3. Start frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Try to register a new account at `http://localhost:3000/register`

## Troubleshooting

### "Invalid API key"
- Check that you're using the correct API key for the environment
- Verify the key hasn't been rotated

### "CORS error"
- Check CORS settings in Supabase Authentication → URL Configuration
- Ensure your frontend URL is in the redirect URLs list

### "RLS policy violation"
- Verify that the user is authenticated
- Check that RLS policies were created correctly in the database

### "Connection refused"
- Ensure Supabase project is running
- Check network connectivity
- Verify API URL is correct

## Next Steps

1. Configure email templates (optional) in Authentication → Email Templates
2. Set up password reset email (optional)
3. Configure social authentication providers (optional)
4. Set up database backups (optional)

## Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
