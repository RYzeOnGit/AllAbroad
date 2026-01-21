"""FastAPI application entry point."""
import logging
import json
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings
from app.database import init_db
from app.routes import api_router
from app.models import Lead, User  # noqa: F401 - imported for metadata registration

logger = logging.getLogger(__name__)

# #region agent log
import os
LOG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".cursor", "debug.log")
def _debug_log(location, message, data, hypothesis_id):
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":hypothesis_id,"location":location,"message":message,"data":data,"timestamp":int(datetime.now().timestamp()*1000)}) + "\n")
    except: pass
# #endregion


# Initialize FastAPI app
app = FastAPI(
    title="AllAbroad Lead Generation API",
    description="Backend API for capturing and processing study-abroad leads",
    version="1.0.0",
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url="/redoc" if settings.environment == "development" else None,
)

# #region agent log
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api"):
            _debug_log("app/main.py:23", "Incoming API request", {"method": request.method, "path": str(request.url.path), "client": str(request.client)}, "A")
        response = await call_next(request)
        if request.url.path.startswith("/api"):
            _debug_log("app/main.py:23", "API request response", {"method": request.method, "path": str(request.url.path), "status": response.status_code}, "A")
        return response
app.add_middleware(RequestLoggingMiddleware)
# #endregion

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
# #region agent log
_debug_log("app/main.py:32", "API router registered", {"prefix": "/api", "app_title": app.title}, "A")
# #endregion


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    # #region agent log
    _debug_log("app/main.py:35", "App startup event triggered", {"app_title": app.title, "env": settings.environment}, "D")
    # #endregion
    try:
        await init_db()
        # #region agent log
        _debug_log("app/main.py:40", "Database initialization succeeded", {}, "D")
        # #endregion
    except Exception as exc:
        # Log the error but allow the app to start so non-DB routes still work
        logger.error("Database initialization failed: %s", exc)
        # #region agent log
        _debug_log("app/main.py:44", "Database initialization failed", {"error": str(exc)}, "D")
        # #endregion


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "AllAbroad Lead Generation API"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}

