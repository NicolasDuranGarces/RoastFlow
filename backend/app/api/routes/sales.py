from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ...models import Sale, SaleCreate, SaleRead, SaleUpdate
from ..deps import get_current_active_user, get_session

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get("/", response_model=list[SaleRead])
def list_sales(session: Session = Depends(get_session), _: object = Depends(get_current_active_user)):
    return session.exec(select(Sale)).all()


@router.post("/", response_model=SaleRead, status_code=status.HTTP_201_CREATED)
def create_sale(
    payload: SaleCreate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    if payload.quantity_kg <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be greater than zero")

    sale = Sale.model_validate(payload)
    sale.total_price = sale.quantity_kg * sale.price_per_kg
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

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(sale, key, value)

    if sale.quantity_kg <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be greater than zero")

    sale.total_price = sale.quantity_kg * sale.price_per_kg

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
