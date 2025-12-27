"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routes import api_router

# Initialize FastAPI app
app = FastAPI(
    title="AllAbroad Lead Generation API",
    description="Backend API for capturing and processing study-abroad leads",
    version="1.0.0",
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url="/redoc" if settings.environment == "development" else None,
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    await init_db()


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "AllAbroad Lead Generation API"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}

