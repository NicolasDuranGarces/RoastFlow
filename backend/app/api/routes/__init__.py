from fastapi import APIRouter

from . import auth, customers, dashboard, expenses, farms, lots, roasts, sales, users, varieties

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(farms.router)
api_router.include_router(varieties.router)
api_router.include_router(lots.router)
api_router.include_router(roasts.router)
api_router.include_router(customers.router)
api_router.include_router(sales.router)
api_router.include_router(expenses.router)
api_router.include_router(users.router)
api_router.include_router(dashboard.router)

__all__ = ["api_router"]
