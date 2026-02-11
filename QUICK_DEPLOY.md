# Quick Deploy Guide - Database & Backend

## 🚀 TL;DR Version

### 1. Deploy Database (5 minutes)

**On Render:**
1. Go to https://render.com → "New +" → "PostgreSQL"
2. Name: `allabroad-db`
3. Copy the **External Database URL** (looks like `postgresql://user:pass@host:5432/db`)

### 2. Migrate Data (2 minutes)

```bash
# Activate venv
source venv/bin/activate

# Run migration to production
python migrate_to_production.py "postgresql://user:pass@host:5432/db"
# Paste your External Database URL from step 1
```

### 3. Deploy Backend (5 minutes)

**On Render:**
1. "New +" → "Web Service"
2. Connect GitHub repo
3. Render auto-detects `render.yaml` → Click "Apply"
4. Set environment variables:
   ```
   DATABASE_URL=<paste-from-step-1>
   ENVIRONMENT=production
   JWT_SECRET=<generate-with-command-below>
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=15
   ```
5. Generate JWT secret:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

### 4. Update Frontend (2 minutes)

**On Netlify:**
1. Site settings → Environment variables
2. Add: `VITE_API_BASE_URL` = `https://your-backend.onrender.com/api`
3. Redeploy

**Done!** ✅

---

## 📋 Detailed Steps

See `DEPLOY_STEP_BY_STEP.md` for full instructions.

---

## 🔑 Important URLs

After deployment, you'll have:
- **Database**: `postgresql://...` (from Render dashboard)
- **Backend**: `https://allabroad-api.onrender.com` (from Render)
- **Frontend**: `https://your-site.netlify.app` (already deployed)

---

## ⚠️ Common Issues

**Backend won't start?**
- Check Render logs
- Verify all environment variables are set
- Make sure `DATABASE_URL` is correct

**Can't connect to database?**
- Use **External Database URL** (not Internal)
- Check database is running in Render

**CORS errors?**
- Add Netlify domain to `CORS_ORIGINS` in Render env vars
- Or update `app/main.py` to include your domain

**Free tier slow?**
- First request takes 30-60 seconds (service spins up)
- Consider paid plan for always-on

