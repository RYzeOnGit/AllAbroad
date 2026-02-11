# Quick Backend Deployment Guide

## Deploy to Render (Recommended - Free tier available)

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

### Step 2: Deploy Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Render will auto-detect `render.yaml` - click "Apply"
4. Or manually configure:
   - **Name**: `allabroad-api`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to you
   - **Branch**: `main` (or your main branch)
   - **Root Directory**: Leave empty (root of repo)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 3: Set Environment Variables
In Render dashboard, go to Environment tab and add:

```
DATABASE_URL=postgresql://allabroad_user:allabroad_password_2024@localhost:5432/allabroad
ENVIRONMENT=production
LOG_LEVEL=INFO
JWT_SECRET=<generate-this>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
ADMIN_EMAIL=admin@allabroad.com
ADMIN_PASSWORD=<your-secure-password>
```

**Generate JWT Secret:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Important**: Update `DATABASE_URL` to your production PostgreSQL (Supabase or Render PostgreSQL)

### Step 4: Get Your Backend URL
After deployment, Render gives you a URL like:
`https://allabroad-api.onrender.com`

**Note**: Free tier services spin down after inactivity. First request may take 30-60 seconds.

## Alternative: Deploy to Railway

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select your repo
4. Railway auto-detects Python
5. Set environment variables (same as above)
6. Deploy!

## After Deployment

1. **Test your backend**: Visit `https://your-backend.onrender.com/health`
2. **Update Netlify**: Set `VITE_API_BASE_URL=https://your-backend.onrender.com/api`
3. **Redeploy frontend** on Netlify

## Database Setup

You need a production PostgreSQL database:

### Option 1: Supabase (Free tier)
1. Sign up at https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy connection string
5. Update `DATABASE_URL` in Render
6. Run migration script pointing to Supabase

### Option 2: Render PostgreSQL
1. In Render dashboard: New → PostgreSQL
2. Create database
3. Copy connection string
4. Update `DATABASE_URL` in Render

