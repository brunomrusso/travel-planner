# Deployment Guide

## Prerequisites

- GitHub account with repository
- Render account (for backend)
- Vercel account (for frontend)
- Supabase project configured

## Backend Deployment (Render)

### Step 1: Prepare Repository

1. Initialize Git repository:
```bash
cd travel-planner
git init
git add .
git commit -m "Initial commit"
```

2. Push to GitHub:
```bash
git remote add origin https://github.com/yourusername/travel-planner.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Fill in deployment settings:
   - **Name**: `travel-planner-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
   - **Root Directory**: `backend`
6. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `BACKEND_URL` (your Render URL)
   - `FRONTEND_URL` (your Vercel URL)
7. Click "Create Web Service"
8. Wait for deployment (2-5 minutes)
9. Copy the service URL (e.g., `https://travel-planner-api.onrender.com`)

### Step 3: Update Frontend URL

Update `FRONTEND_URL` environment variable in Render with your Vercel URL once deployed.

## Frontend Deployment (Vercel)

### Step 1: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Select your GitHub repository
5. Fill in project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
6. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (your Render URL)
7. Click "Deploy"
8. Wait for deployment (2-5 minutes)
9. Copy the deployment URL

### Step 2: Update Supabase Configuration

1. Go to Supabase → Authentication → URL Configuration
2. Update **Site URL** to your Vercel URL
3. Add your Vercel URL to **Redirect URLs**

### Step 3: Update Render Backend

1. Go to Render dashboard
2. Select your backend service
3. Go to Environment
4. Update `FRONTEND_URL` with your Vercel URL
5. Service will redeploy automatically

## Post-Deployment Checklist

- [ ] Backend health check: `https://your-render-url/health`
- [ ] Frontend loads: `https://your-vercel-url`
- [ ] Can register new account
- [ ] Can login
- [ ] Can create a trip
- [ ] Can view trip details
- [ ] Supabase RLS policies working correctly

## Monitoring

### Render
- View logs: Dashboard → Service → Logs
- Check metrics: Dashboard → Service → Metrics

### Vercel
- View logs: Dashboard → Project → Deployments → Logs
- Check analytics: Dashboard → Project → Analytics

## Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure `requirements.txt` is in the `backend` directory

### Frontend shows blank page
- Check browser console for errors
- Verify environment variables in Vercel
- Check that backend is running and accessible

### CORS errors
- Verify `FRONTEND_URL` is set correctly in backend
- Check that Supabase CORS settings are correct
- Ensure API calls use correct backend URL

### Authentication not working
- Verify Supabase URL and keys are correct
- Check Supabase Authentication → URL Configuration
- Ensure redirect URLs include your Vercel domain

## Scaling Considerations

### Backend (Render)
- Free tier: Limited to 750 hours/month
- Paid tier: Unlimited with auto-scaling
- Database: Supabase handles scaling automatically

### Frontend (Vercel)
- Free tier: Unlimited deployments
- Paid tier: Advanced features and priority support

## Cost Estimation (Monthly)

- **Render**: $7-12 (if using paid tier)
- **Vercel**: Free (for most use cases)
- **Supabase**: Free tier includes 500MB storage, 2GB bandwidth
- **Total**: ~$7-12/month for small-scale deployment

## Useful Links

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Hosting Guide](https://supabase.com/docs/guides/hosting)
