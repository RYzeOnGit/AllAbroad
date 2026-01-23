# Quick Start Guide

## Step 1: Install Python Virtual Environment Support

```bash
sudo apt update
sudo apt install -y python3.12-venv
```

## Step 2: Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

**OR** do it manually:

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

## Step 3: Create Environment File

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then edit `.env` and add your Supabase PostgreSQL connection string:

```
DATABASE_URL=postgresql://user:password@host:port/database
ENVIRONMENT=development
LOG_LEVEL=INFO
```

**Note:** If you don't have a database yet, you can still run the server to see the endpoints, but they won't work without a valid DATABASE_URL.

## Step 4: Run the Server

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Run the server
uvicorn app.main:app --reload
```

## Step 5: View API Documentation

Once the server is running, visit:

- **Interactive API Docs (Swagger UI):** http://localhost:8000/docs
- **Alternative Docs (ReDoc):** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

## Available Endpoints

- `GET /` - Root health check
- `GET /health` - Health check endpoint
- `POST /api/leads` - Submit a new lead

## Test the API

```bash
curl -X POST http://localhost:8000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+1234567890",
    "country": "USA",
    "target_country": "UK",
    "intake": "Fall 2024",
    "budget": "$20,000-$30,000",
    "source": "website"
  }'
```

