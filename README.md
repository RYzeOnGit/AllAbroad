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
# Edit .env with your Supabase PostgreSQL connection string
```

3. Run the application:
```bash
uvicorn app.main:app --reload
```

## Deployment on Render

1. Set environment variables in Render dashboard:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string
   - `ENVIRONMENT`: `production`
   - `LOG_LEVEL`: `INFO`

2. Build command: `pip install -r requirements.txt`

3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## API Endpoints

- `POST /leads` - Submit a new lead

