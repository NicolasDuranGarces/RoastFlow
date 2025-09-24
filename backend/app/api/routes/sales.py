from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from ...models import RoastBatch, Sale, SaleCreate, SaleItem, SaleItemCreate, SaleRead, SaleUpdate
from ..deps import get_current_active_user, get_session

router = APIRouter(prefix="/sales", tags=["sales"])

def _available_roasted(session: Session, roast_id: int, exclude_sale_id: int | None = None) -> float:
    roast = session.get(RoastBatch, roast_id)
    if not roast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roast not found")

    query = select(func.coalesce(func.sum(SaleItem.bag_size_g * SaleItem.bags), 0)).where(
        SaleItem.roast_batch_id == roast_id
    )
    if exclude_sale_id is not None:
        query = query.where(SaleItem.sale_id != exclude_sale_id)

    used = session.exec(query).one()
    available = roast.roasted_output_g - used
    return max(available, 0.0)


def _validate_items(
    session: Session,
    items: list[SaleItemCreate],
    exclude_sale_id: int | None = None,
) -> tuple[float, float]:
    if not items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debe registrar al menos una tostión")

    totals_by_roast: dict[int, float] = defaultdict(float)
    total_price = 0.0
    total_quantity = 0.0

    for item in items:
        if item.bag_size_g <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El tamaño de la bolsa debe ser mayor a cero",
            )
        if item.bags <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Las bolsas deben ser mayores a cero")
        if item.bag_price <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="El precio por bolsa debe ser mayor a cero"
            )

        grams = float(item.bag_size_g) * float(item.bags)
        totals_by_roast[item.roast_batch_id] += grams
        total_price += round(float(item.bag_price)) * float(item.bags)
        total_quantity += grams

    for roast_id, grams in totals_by_roast.items():
        available = _available_roasted(session, roast_id, exclude_sale_id=exclude_sale_id)
        if grams > available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "No hay suficiente inventario tostado para la tostión solicitada. Disponible: "
                    f"{available:.0f} g"
                ),
            )

    return total_price, total_quantity


def _resolve_payment(
    *,
    total_price: float,
    is_paid: bool,
    amount_paid: float | None,
) -> tuple[bool, float]:
    if amount_paid is None:
        resolved_amount = total_price if is_paid else 0.0
    else:
        if amount_paid < 0 or amount_paid > total_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El valor pagado debe estar entre 0 y el total de la venta",
            )
        resolved_amount = amount_paid
        if resolved_amount < total_price:
            is_paid = False
        elif resolved_amount == total_price:
            is_paid = True
    return is_paid, resolved_amount


def _normalise_sale_instance(sale: Sale) -> Sale:
    if sale.amount_paid is None:
        sale.amount_paid = 0.0
    if sale.is_paid is None:
        sale.is_paid = sale.amount_paid >= sale.total_price
    if sale.is_paid and not sale.paid_at:
        sale.paid_at = sale.sale_date
    return sale


@router.get("/", response_model=list[SaleRead])
def list_sales(session: Session = Depends(get_session), _: object = Depends(get_current_active_user)):
    statement = select(Sale).options(selectinload(Sale.items)).order_by(Sale.sale_date.desc(), Sale.id.desc())
    sales = session.exec(statement).all()
    return [_normalise_sale_instance(sale) for sale in sales]


@router.post("/", response_model=SaleRead, status_code=status.HTTP_201_CREATED)
def create_sale(
    payload: SaleCreate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    total_price, total_quantity = _validate_items(session, payload.items)

    base_data = payload.model_dump(exclude={"items"}, exclude_unset=True)
    amount_input = base_data.get("amount_paid")

    resolved_is_paid, resolved_amount = _resolve_payment(
        total_price=total_price,
        is_paid=payload.is_paid,
        amount_paid=amount_input,
    )

    sale = Sale(**base_data)
    sale.total_price = round(total_price)
    sale.total_quantity_g = total_quantity
    sale.is_paid = resolved_is_paid
    sale.amount_paid = resolved_amount
    sale.paid_at = (
        payload.paid_at
        if resolved_is_paid and payload.paid_at
        else (payload.sale_date if resolved_is_paid else None)
    )
    sale.items = []

    for item in payload.items:
        sale.items.append(
            SaleItem(
                roast_batch_id=item.roast_batch_id,
                bag_size_g=item.bag_size_g,
                bags=item.bags,
                bag_price=item.bag_price,
                notes=item.notes,
            )
        )

    session.add(sale)
    session.commit()
    session.refresh(sale)
    return _normalise_sale_instance(sale)


@router.get("/debts", response_model=list[SaleRead])
def list_debts(
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    statement = (
        select(Sale)
        .options(selectinload(Sale.items))
        .where(Sale.total_price > func.coalesce(Sale.amount_paid, 0.0) + 1e-6)
        .order_by(Sale.sale_date.desc(), Sale.id.desc())
    )
    sales = session.exec(statement).all()
    return [_normalise_sale_instance(sale) for sale in sales]


@router.get("/{sale_id}", response_model=SaleRead)
def get_sale(
    sale_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    sale = session.get(Sale, sale_id)
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")
    return sale


@router.put("/{sale_id}", response_model=SaleRead)
def update_sale(
    sale_id: int,
    payload: SaleUpdate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    sale = session.get(Sale, sale_id)
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")

    update_data = payload.model_dump(exclude_unset=True, exclude={"items", "amount_paid", "is_paid", "paid_at"})
    for key, value in update_data.items():
        setattr(sale, key, value)

    if payload.items is not None:
        total_price, total_quantity = _validate_items(session, payload.items, exclude_sale_id=sale.id)

        # remove existing items
        for item in list(sale.items):
            session.delete(item)
        sale.items = []

        for item in payload.items:
            sale.items.append(
                SaleItem(
                    roast_batch_id=item.roast_batch_id,
                    bag_size_g=item.bag_size_g,
                    bags=item.bags,
                    bag_price=item.bag_price,
                    notes=item.notes,
                )
            )

        sale.total_price = round(total_price)
        sale.total_quantity_g = total_quantity
        if sale.amount_paid > sale.total_price:
            sale.amount_paid = sale.total_price
            sale.is_paid = True
        elif sale.amount_paid < sale.total_price:
            sale.is_paid = False

    if payload.amount_paid is not None or payload.is_paid is not None:
        desired_is_paid = payload.is_paid if payload.is_paid is not None else sale.is_paid
        amount_input = (
            payload.amount_paid
            if payload.amount_paid is not None
            else (None if payload.is_paid is not None else sale.amount_paid)
        )
        resolved_is_paid, resolved_amount = _resolve_payment(
            total_price=sale.total_price,
            is_paid=desired_is_paid,
            amount_paid=amount_input,
        )
        sale.is_paid = resolved_is_paid
        sale.amount_paid = resolved_amount

    if payload.paid_at is not None:
        sale.paid_at = payload.paid_at
    elif sale.is_paid and not sale.paid_at:
        sale.paid_at = date.today()
    elif not sale.is_paid:
        sale.paid_at = None

    session.add(sale)
    session.commit()
    session.refresh(sale)
    return _normalise_sale_instance(sale)


@router.delete("/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sale(
    sale_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    sale = session.get(Sale, sale_id)
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")
    session.delete(sale)
    session.commit()
    return None
