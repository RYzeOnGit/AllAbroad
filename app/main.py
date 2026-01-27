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
from app.seed_admin import seed_admin

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
# Add middleware to catch ALL requests (outermost layer - added first, executed last in chain)
class PreCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Log EVERY request, not just /api
        _debug_log("app/main.py:39", "PreCORSMiddleware: ANY request received", {
            "method": request.method,
            "path": str(request.url.path),
            "full_url": str(request.url),
            "origin": request.headers.get("origin", "none"),
            "user_agent": request.headers.get("user-agent", "none")[:50],
        }, "E")
        try:
            response = await call_next(request)
            _debug_log("app/main.py:49", "PreCORSMiddleware: Response generated", {
                "method": request.method,
                "path": str(request.url.path),
                "status": response.status_code,
                "has_cors_headers": any("access-control" in k.lower() for k in response.headers.keys()),
            }, "E")
            return response
        except Exception as e:
            _debug_log("app/main.py:58", "PreCORSMiddleware: Exception caught", {
                "method": request.method,
                "path": str(request.url.path),
                "error": str(e),
                "error_type": type(e).__name__,
            }, "E")
            raise
app.add_middleware(PreCORSMiddleware)
# #endregion

# CORS middleware for frontend integration
# Note: Must be explicit with methods - "*" can cause issues with OPTIONS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",  # Added - frontend is running on 3001
        "http://localhost:5173", 
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*"],
    max_age=3600,
)
# #region agent log
_debug_log("app/main.py:67", "CORS middleware configured", {
    "allow_origins": ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    "allow_methods": ["*"],
}, "D")
# #endregion

# #region agent log
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Log ALL requests including OPTIONS to debug CORS issue
        if request.url.path.startswith("/api"):
            _debug_log("app/main.py:50", "RequestLoggingMiddleware: Request received", {
                "method": request.method,
                "path": str(request.url.path),
                "client": str(request.client),
                "headers": dict(request.headers),
            }, "A")
        # #region agent log
        if request.method == "OPTIONS":
            _debug_log("app/main.py:52", "RequestLoggingMiddleware: OPTIONS request detected, calling next", {
                "path": str(request.url.path)
            }, "B")
        # #endregion
        response = await call_next(request)
        if request.url.path.startswith("/api"):
            _debug_log("app/main.py:59", "RequestLoggingMiddleware: Response generated", {
                "method": request.method,
                "path": str(request.url.path),
                "status": response.status_code,
                "headers": dict(response.headers),
            }, "A")
        return response
app.add_middleware(RequestLoggingMiddleware)
# #endregion

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
        try:
            await seed_admin()
        except Exception as seed_err:
            logger.warning("Admin seeding failed: %s", seed_err)
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


# Catch-all OPTIONS handler for CORS preflight (must be after all other routes)
@app.options("/{full_path:path}")
async def options_handler(full_path: str, request: Request):
    """Handle all OPTIONS requests for CORS preflight."""
    # #region agent log
    _debug_log("app/main.py:165", "App-level OPTIONS handler called", {
        "path": full_path,
        "full_path": str(request.url.path),
        "origin": request.headers.get("origin", "none"),
    }, "F")
    # #endregion
    from fastapi.responses import Response
    origin = request.headers.get("origin", "*")
    # Only allow origins from our whitelist
    allowed_origins = [
        "http://localhost:3000", 
        "http://localhost:3001",  # Added - frontend is running on 3001
        "http://localhost:5173", 
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173"
    ]
    if origin in allowed_origins:
        allow_origin = origin
    else:
        allow_origin = "*"
    
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": allow_origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Origin, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        }
    )

