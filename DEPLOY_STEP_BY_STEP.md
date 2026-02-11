# Step-by-Step: Deploy Database & Backend

## Overview
- **Database**: PostgreSQL on Render (or Supabase)
- **Backend**: FastAPI on Render
- **Frontend**: Already on Netlify ✅

---

## Part 1: Deploy PostgreSQL Database

### Option A: Render PostgreSQL (Recommended - Easy)

1. **Go to Render Dashboard**
   - Visit https://render.com
   - Sign up/login with GitHub

2. **Create PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Fill in:
     - **Name**: `allabroad-db`
     - **Database**: `allabroad` (or leave default)
     - **User**: `allabroad_user` (or leave default)
     - **Region**: Choose closest to you
     - **PostgreSQL Version**: 15 (or latest)
     - **Plan**: Free (or paid for better performance)

3. **Get Connection String**
   - After creation, Render shows you:
     - **Internal Database URL** (for services in same region)
     - **External Database URL** (for outside connections)
   - Copy the **External Database URL** - it looks like:
     ```
     postgresql://allabroad_user:password123@dpg-xxxxx-a.oregon-postgres.render.com/allabroad
     ```

4. **Save Connection String**
   - You'll need this for the backend deployment
   - Keep it secure - don't commit to git!

---

### Option B: Supabase (Alternative - Also Free)

1. **Go to Supabase**
   - Visit https://supabase.com
   - Sign up/login

2. **Create New Project**
   - Click "New Project"
   - Fill in:
     - **Name**: `allabroad`
     - **Database Password**: (save this!)
     - **Region**: Choose closest

3. **Get Connection String**
   - Go to Settings → Database
   - Scroll to "Connection string"
   - Copy "URI" format:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with your actual password

---

## Part 2: Migrate Data to Production Database

### Step 1: Update Migration Script

You already have `migrate_to_postgresql.py`. To use it with production:

```bash
# Make sure you have the production DATABASE_URL
export PROD_DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Run migration (pointing to production)
python migrate_to_postgresql.py --target-url "$PROD_DATABASE_URL"
```

Or edit the script to use the production URL directly.

### Step 2: Run Migration

```bash
# Activate venv
source venv/bin/activate

# Run migration
python migrate_to_postgresql.py
# When prompted, enter your production DATABASE_URL
```

**Note**: This will copy all data from your local SQLite to production PostgreSQL.

---

## Part 3: Deploy Backend to Render

### Step 1: Prepare Repository

Make sure your code is pushed to GitHub:
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Create Web Service on Render

1. **Go to Render Dashboard**
   - Click "New +" → "Web Service"
   - Or if you have `render.yaml`, click "New" → "Blueprint"

2. **Connect Repository**
   - Connect your GitHub account if not already
   - Select your `AllAbroad` repository
   - Click "Connect"

3. **Configure Service** (if using Blueprint, Render auto-detects from `render.yaml`)

   **Basic Settings:**
   - **Name**: `allabroad-api`
   - **Environment**: `Python 3`
   - **Region**: Same as your database (for better performance)
   - **Branch**: `main` (or your main branch)
   - **Root Directory**: Leave empty

   **Build & Deploy:**
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 3: Set Environment Variables

In Render dashboard, go to **Environment** tab and add:

```bash
# Database (use the connection string from Part 1)
DATABASE_URL=postgresql://allabroad_user:password@dpg-xxxxx-a.oregon-postgres.render.com/allabroad

# Environment
ENVIRONMENT=production
LOG_LEVEL=INFO

# JWT Authentication
JWT_SECRET=<generate-this-see-below>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15

# Admin Account (optional - for auto-seeding)
ADMIN_EMAIL=admin@allabroad.com
ADMIN_PASSWORD=<your-secure-password>

# CORS (optional - your Netlify domain)
CORS_ORIGINS=https://your-site.netlify.app
```

**Generate JWT Secret:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Copy the output and paste as `JWT_SECRET`.

### Step 4: Deploy

1. Click "Create Web Service" (or "Apply" if using Blueprint)
2. Render will:
   - Clone your repo
   - Install dependencies
   - Start your backend
3. Wait for deployment (2-5 minutes)

### Step 5: Get Your Backend URL

After deployment, Render gives you a URL like:
```
https://allabroad-api.onrender.com
```

**Test it:**
- Visit: `https://allabroad-api.onrender.com/health`
- Should return: `{"status": "healthy"}`

---

## Part 4: Update Frontend to Use Production Backend

### Step 1: Get Netlify Environment Variables

1. Go to Netlify Dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click "Add variable"

### Step 2: Add Backend URL

- **Key**: `VITE_API_BASE_URL`
- **Value**: `https://allabroad-api.onrender.com/api`

**Important**: Include `/api` at the end!

### Step 3: Redeploy Frontend

- Netlify will auto-redeploy, or
- Go to **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

---

## Part 5: Verify Everything Works

### Test Checklist

1. **Backend Health**
   - Visit: `https://allabroad-api.onrender.com/health`
   - ✅ Should return `{"status": "healthy"}`

2. **API Docs** (if enabled in production)
   - Visit: `https://allabroad-api.onrender.com/docs`
   - ✅ Should show Swagger UI

3. **Frontend Login**
   - Go to your Netlify site
   - Try logging in
   - ✅ Should connect to backend

4. **Database Connection**
   - Check Render logs for backend
   - ✅ Should show no database connection errors

---

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify all environment variables are set
- Check `requirements.txt` is correct

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check database is running in Render
- Ensure database allows external connections (use External URL)

### CORS errors
- Add your Netlify domain to `CORS_ORIGINS` environment variable
- Or update `app/main.py` to include your domain

### 404 errors on API calls
- Verify `VITE_API_BASE_URL` includes `/api`
- Check backend routes are prefixed with `/api`

### Free tier slow startup
- Render free tier spins down after 15 min inactivity
- First request may take 30-60 seconds
- Consider paid plan for always-on service

---

## Quick Reference

### Render URLs
- **Dashboard**: https://dashboard.render.com
- **Your Backend**: `https://allabroad-api.onrender.com`
- **Your Database**: Check in Render dashboard

### Environment Variables Needed

**Backend (Render):**
```
DATABASE_URL=postgresql://...
ENVIRONMENT=production
JWT_SECRET=...
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
```

**Frontend (Netlify):**
```
VITE_API_BASE_URL=https://allabroad-api.onrender.com/api
```

---

## Next Steps After Deployment

1. ✅ Test login functionality
2. ✅ Test document uploads
3. ✅ Test application CRUD
4. ✅ Monitor Render logs for errors
5. ✅ Set up monitoring/alerts (optional)

---

## Cost Estimate

**Free Tier:**
- Render PostgreSQL: Free (limited hours)
- Render Web Service: Free (spins down after inactivity)
- Netlify: Free
- **Total: $0/month** (with limitations)

**Paid Tier (Recommended for Production):**
- Render PostgreSQL: ~$7/month (always on)
- Render Web Service: ~$7/month (always on)
- Netlify: Free
- **Total: ~$14/month**

