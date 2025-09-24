from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from ...models import CoffeeLot, Expense, RoastBatch, Sale
from ...schemas.dashboard import CashSummary, DashboardSummary, InventorySummary
from ..deps import get_current_active_user, get_session

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

RECENT_LIMIT = 5


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
) -> DashboardSummary:
    total_green_purchased = session.exec(
        select(func.coalesce(func.sum(CoffeeLot.green_weight_g), 0.0))
    ).one()
    total_roasted_produced = session.exec(
        select(func.coalesce(func.sum(RoastBatch.roasted_output_g), 0.0))
    ).one()
    total_green_used = session.exec(
        select(func.coalesce(func.sum(RoastBatch.green_input_g), 0.0))
    ).one()
    total_roasted_sold = session.exec(
        select(func.coalesce(func.sum(Sale.total_quantity_g), 0.0))
    ).one()
    total_sales_quantity = total_roasted_sold

    purchase_costs = session.exec(
        select(
            func.coalesce(
                func.sum(CoffeeLot.green_weight_g * (CoffeeLot.price_per_kg / 1000.0)),
                0.0,
            )
        )
    ).one()
    total_sales_amount = session.exec(
        select(func.coalesce(func.sum(Sale.total_price), 0.0))
    ).one()
    total_expenses_amount = session.exec(
        select(func.coalesce(func.sum(Expense.amount), 0.0))
    ).one()

    green_available = total_green_purchased - total_green_used
    roasted_available = total_roasted_produced - total_roasted_sold
    average_price_per_g = total_sales_amount / total_sales_quantity if total_sales_quantity > 0 else 0.0

    usage_by_lot = {
        lot_id: used
        for lot_id, used in session.exec(
            select(RoastBatch.lot_id, func.coalesce(func.sum(RoastBatch.green_input_g), 0.0)).group_by(RoastBatch.lot_id)
        )
    }

    lots = session.exec(select(CoffeeLot)).all()
    green_inventory_value = 0.0
    for lot in lots:
        used = usage_by_lot.get(lot.id, 0.0)
        remaining = max(lot.green_weight_g - used, 0.0)
        green_inventory_value += (remaining / 1000.0) * lot.price_per_kg

    roasted_inventory_value = max(roasted_available, 0.0) * average_price_per_g
    coffee_inventory_value = green_inventory_value + roasted_inventory_value
    expected_cash = total_sales_amount - (total_expenses_amount + purchase_costs)

    recent_purchases = session.exec(
        select(CoffeeLot)
        .order_by(CoffeeLot.purchase_date.desc(), CoffeeLot.id.desc())
        .limit(RECENT_LIMIT)
    ).all()

    recent_expenses = session.exec(
        select(Expense)
        .order_by(Expense.expense_date.desc(), Expense.id.desc())
        .limit(RECENT_LIMIT)
    ).all()

    recent_sales = session.exec(
        select(Sale)
        .options(selectinload(Sale.items))
        .order_by(Sale.sale_date.desc(), Sale.id.desc())
        .limit(RECENT_LIMIT)
    ).all()

    return DashboardSummary(
        cash=CashSummary(
            expected_cash=expected_cash,
            total_sales=total_sales_amount,
            total_purchases=purchase_costs,
            total_expenses=total_expenses_amount,
            coffee_inventory_value=coffee_inventory_value,
            green_inventory_value=green_inventory_value,
            roasted_inventory_value=roasted_inventory_value,
        ),
        inventory=InventorySummary(
            green_available_g=max(green_available, 0.0),
            roasted_available_g=max(roasted_available, 0.0),
        ),
        recent_purchases=recent_purchases,
        recent_expenses=recent_expenses,
        recent_sales=recent_sales,
    )
