from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlmodel import Session, select

from ...models import CoffeeLot, Expense, RoastBatch, Sale
from ...schemas.dashboard import DashboardSummary, FinancialSummary, InventorySummary, RoastSummary
from ..deps import get_current_active_user, get_session

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
) -> DashboardSummary:
    total_green_purchased = session.exec(
        select(func.coalesce(func.sum(CoffeeLot.green_weight_kg), 0.0))
    ).one()
    total_roasted_produced = session.exec(
        select(func.coalesce(func.sum(RoastBatch.roasted_output_kg), 0.0))
    ).one()
    total_green_used = session.exec(
        select(func.coalesce(func.sum(RoastBatch.green_input_kg), 0.0))
    ).one()
    total_roasted_sold = session.exec(
        select(func.coalesce(func.sum(Sale.quantity_kg), 0.0))
    ).one()

    purchase_costs = session.exec(
        select(func.coalesce(func.sum(CoffeeLot.green_weight_kg * CoffeeLot.price_per_kg), 0.0))
    ).one()
    total_sales_amount = session.exec(
        select(func.coalesce(func.sum(Sale.total_price), 0.0))
    ).one()
    total_expenses_amount = session.exec(
        select(func.coalesce(func.sum(Expense.amount), 0.0))
    ).one()

    green_available = total_green_purchased - total_green_used
    roasted_available = total_roasted_produced - total_roasted_sold
    net_profit = total_sales_amount - (total_expenses_amount + purchase_costs)

    return DashboardSummary(
        inventory=InventorySummary(
            green_available_kg=max(green_available, 0.0),
            roasted_available_kg=max(roasted_available, 0.0),
        ),
        financials=FinancialSummary(
            total_sales=total_sales_amount,
            total_expenses=total_expenses_amount,
            purchase_costs=purchase_costs,
            net_profit=net_profit,
        ),
        roasts=RoastSummary(
            total_green_purchased=total_green_purchased,
            total_roasted_produced=total_roasted_produced,
        ),
    )
