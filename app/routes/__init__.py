from fastapi import APIRouter
from app.routes.leads import router as leads_router
from app.routes.auth import router as auth_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(leads_router)

