from pydantic import BaseModel


class InventorySummary(BaseModel):
    green_available_kg: float
    roasted_available_kg: float


class FinancialSummary(BaseModel):
    total_sales: float
    total_expenses: float
    purchase_costs: float
    net_profit: float
    total_quantity_sold: float
    average_price_per_kg: float
    projected_full_sale_value: float
    projected_half_sale_value: float


class RoastSummary(BaseModel):
    total_green_purchased: float
    total_roasted_produced: float
    total_roasted_sold: float


class DashboardSummary(BaseModel):
    inventory: InventorySummary
    financials: FinancialSummary
    roasts: RoastSummary
