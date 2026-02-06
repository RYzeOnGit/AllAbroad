from fastapi import APIRouter
from app.routes.leads import router as leads_router
from app.routes.auth import router as auth_router
from app.routes.admin import router as admin_router
from app.routes.content import router as content_router
from app.routes.student import router as student_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(leads_router)
api_router.include_router(admin_router)
api_router.include_router(content_router)
api_router.include_router(student_router)

