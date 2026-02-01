# Quick Start Guide

## Backend (FastAPI)

```bash
# Navigate to project root
cd /home/ryan/Coding/projects/AllAbroad

# Activate virtual environment
source venv/bin/activate

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at:** http://localhost:8000

**API Docs:** http://localhost:8000/docs

---

## Frontend (React + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**Frontend will be available at:** http://localhost:5173 (or the port shown in terminal)

---

## Tips

- **Backend auto-reloads** when you change Python files (thanks to `--reload` flag)
- **Frontend auto-reloads** when you change React files (Vite HMR)
- Make sure your `.env` file is configured with:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `ADMIN_EMAIL` and `ADMIN_PASSWORD` (optional, for auto-seeding)
- If you see port conflicts, change the port:
  - Backend: `--port 8001`
  - Frontend: Edit `vite.config.js` or use `npm run dev -- --port 3001`

---

## Stop Servers

Press `Ctrl+C` in the terminal where the server is running.
