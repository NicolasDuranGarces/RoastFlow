from pydantic import BaseModel

from ..models import CoffeeLotRead, ExpenseRead, SaleRead


class CashSummary(BaseModel):
    expected_cash: float
    total_sales: float
    total_purchases: float
    total_expenses: float
    coffee_inventory_value: float
    green_inventory_value: float
    roasted_inventory_value: float


class InventorySummary(BaseModel):
    green_available_g: float
    roasted_available_g: float


class DashboardSummary(BaseModel):
    cash: CashSummary
    inventory: InventorySummary
    recent_purchases: list[CoffeeLotRead]
    recent_expenses: list[ExpenseRead]
    recent_sales: list[SaleRead]
