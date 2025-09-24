from collections import defaultdict

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
        total_price += float(item.bag_price) * float(item.bags)
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


@router.get("/", response_model=list[SaleRead])
def list_sales(session: Session = Depends(get_session), _: object = Depends(get_current_active_user)):
    statement = select(Sale).options(selectinload(Sale.items)).order_by(Sale.sale_date.desc(), Sale.id.desc())
    return session.exec(statement).all()


@router.post("/", response_model=SaleRead, status_code=status.HTTP_201_CREATED)
def create_sale(
    payload: SaleCreate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    total_price, total_quantity = _validate_items(session, payload.items)

    sale = Sale.model_validate(payload, update={"total_price": total_price, "total_quantity_g": total_quantity})
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
    return sale


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

    update_data = payload.model_dump(exclude_unset=True, exclude={"items"})
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

        sale.total_price = total_price
        sale.total_quantity_g = total_quantity

    session.add(sale)
    session.commit()
    session.refresh(sale)
    return sale


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
