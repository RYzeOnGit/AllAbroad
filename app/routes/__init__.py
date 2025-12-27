from fastapi import APIRouter
from app.routes.leads import router as leads_router

api_router = APIRouter()
api_router.include_router(leads_router, prefix="/leads", tags=["leads"])

