from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ...models import CoffeeLot, CoffeeLotCreate, CoffeeLotRead, CoffeeLotUpdate
from ..deps import get_current_active_user, get_session

router = APIRouter(prefix="/lots", tags=["coffee lots"])


@router.get("/", response_model=list[CoffeeLotRead])
def list_lots(session: Session = Depends(get_session), _: object = Depends(get_current_active_user)):
    return session.exec(select(CoffeeLot)).all()


@router.post("/", response_model=CoffeeLotRead, status_code=status.HTTP_201_CREATED)
def create_lot(
    payload: CoffeeLotCreate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    lot = CoffeeLot.model_validate(payload)
    session.add(lot)
    session.commit()
    session.refresh(lot)
    return lot


@router.get("/{lot_id}", response_model=CoffeeLotRead)
def get_lot(
    lot_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    lot = session.get(CoffeeLot, lot_id)
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lot not found")
    return lot


@router.put("/{lot_id}", response_model=CoffeeLotRead)
def update_lot(
    lot_id: int,
    payload: CoffeeLotUpdate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    lot = session.get(CoffeeLot, lot_id)
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lot not found")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lot, key, value)

    session.add(lot)
    session.commit()
    session.refresh(lot)
    return lot


@router.delete("/{lot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lot(
    lot_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    lot = session.get(CoffeeLot, lot_id)
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lot not found")
    session.delete(lot)
    session.commit()
    return None
