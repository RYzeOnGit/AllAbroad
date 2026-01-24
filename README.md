# AllAbroad Lead Generation Backend

Production-ready FastAPI backend for capturing and processing study-abroad leads.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

The default configuration uses SQLite for local development:
```
DATABASE_URL=sqlite+aiosqlite:///./allabroad.db
```

Generate a secure JWT secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Copy the output and paste it as your `JWT_SECRET` in the `.env` file.

3. Run the application:
```bash
uvicorn app.main:app --reload
```

## Deployment on Render

1. Set environment variables in Render dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string (e.g., Supabase)
   - `ENVIRONMENT`: `production`
   - `LOG_LEVEL`: `INFO`
   - `ADMIN_EMAIL`: Admin user email
   - `ADMIN_PASSWORD`: Admin user password
   - `JWT_SECRET`: Generate using `python -c "import secrets; print(secrets.token_urlsafe(32))"`
   - `JWT_ALGORITHM`: `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `15`

2. Build command: `pip install -r requirements.txt`

3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## API Endpoints

- `POST /api/leads` – Submit a new lead (public)
- `POST /api/auth/login` – Staff login, returns JWT (protected)
- `GET /api/v1/leads` – List all leads (requires admin/manager/counselor)
- `GET /api/v1/leads/{lead_id}` – Get a single lead (requires admin/manager/counselor)
- `GET /` – Health check
- `GET /health` – Health check
