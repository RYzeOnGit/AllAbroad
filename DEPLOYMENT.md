# Deployment Guide

## Architecture

- **Frontend**: Deployed on Netlify (static React app)
- **Backend**: Deployed on Render (FastAPI server)
- **Database**: PostgreSQL (Supabase or Render PostgreSQL)

## Step 1: Deploy Backend to Render

1. **Create a Render account** at https://render.com

2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Render will detect `render.yaml` automatically
   - Or manually configure:
     - **Name**: `allabroad-api`
     - **Environment**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Set Environment Variables** in Render dashboard:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/allabroad
   ENVIRONMENT=production
   LOG_LEVEL=INFO
   JWT_SECRET=your-generated-secret-here
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=15
   ADMIN_EMAIL=admin@allabroad.com
   ADMIN_PASSWORD=your-secure-password
   ```

4. **Generate JWT Secret**:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

5. **Get your backend URL**: After deployment, Render will give you a URL like:
   `https://allabroad-api.onrender.com`

## Step 2: Update Frontend for Production

The frontend needs to know where your backend is deployed.

### Option A: Using Environment Variable (Recommended)

1. **In Netlify Dashboard**:
   - Go to Site settings → Environment variables
   - Add: `VITE_API_BASE_URL` = `https://your-backend.onrender.com/api`

2. **Update frontend code** to use the environment variable (already done in `api/client.js`)

### Option B: Using Netlify Redirects

Add a proxy redirect in `netlify.toml` or `_redirects` file to proxy `/api/*` to your backend.

## Step 3: Configure CORS

Make sure your backend allows requests from your Netlify domain. Check `app/main.py` for CORS settings.

## Step 4: Database Setup

You already have PostgreSQL set up locally. For production:

1. **Option A: Supabase** (Free tier available)
   - Create a project at https://supabase.com
   - Get connection string from Settings → Database
   - Run migration: `python migrate_to_postgresql.py` (pointing to Supabase URL)

2. **Option B: Render PostgreSQL**
   - Create PostgreSQL database in Render
   - Use the connection string provided

## Quick Deploy Checklist

- [ ] Backend deployed on Render
- [ ] Backend URL obtained (e.g., `https://allabroad-api.onrender.com`)
- [ ] Environment variables set in Render
- [ ] Database migrated to production PostgreSQL
- [ ] `VITE_API_BASE_URL` set in Netlify environment variables
- [ ] Frontend redeployed on Netlify
- [ ] Test login functionality

## Troubleshooting

### Backend not responding
- Check Render logs for errors
- Verify environment variables are set correctly
- Check database connection string

### CORS errors
- Ensure backend CORS allows your Netlify domain
- Check `app/main.py` CORS configuration

### 404 errors on API calls
- Verify `VITE_API_BASE_URL` is set correctly in Netlify
- Check that backend URL includes `/api` path
- Ensure backend routes are prefixed with `/api`

