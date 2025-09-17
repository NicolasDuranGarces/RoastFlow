from pydantic import BaseModel


class InventorySummary(BaseModel):
    green_available_kg: float
    roasted_available_kg: float


class FinancialSummary(BaseModel):
    total_sales: float
    total_expenses: float
    purchase_costs: float
    net_profit: float


class RoastSummary(BaseModel):
    total_green_purchased: float
    total_roasted_produced: float


class DashboardSummary(BaseModel):
    inventory: InventorySummary
    financials: FinancialSummary
    roasts: RoastSummary
