from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ...models import (
    PriceReference,
    PriceReferenceCreate,
    PriceReferenceRead,
    PriceReferenceUpdate,
)
from ..deps import get_current_active_user, get_session


router = APIRouter(prefix="/price-references", tags=["price references"])


@router.get("/", response_model=list[PriceReferenceRead])
def list_price_references(
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    statement = select(PriceReference).order_by(PriceReference.bag_size_g, PriceReference.id)
    return session.exec(statement).all()


@router.post("/", response_model=PriceReferenceRead, status_code=status.HTTP_201_CREATED)
def create_price_reference(
    payload: PriceReferenceCreate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    reference = PriceReference.model_validate(payload)
    reference.price = round(reference.price)
    session.add(reference)
    session.commit()
    session.refresh(reference)
    return reference


@router.get("/{reference_id}", response_model=PriceReferenceRead)
def get_price_reference(
    reference_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    reference = session.get(PriceReference, reference_id)
    if not reference:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referencia no encontrada")
    return reference


@router.put("/{reference_id}", response_model=PriceReferenceRead)
def update_price_reference(
    reference_id: int,
    payload: PriceReferenceUpdate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    reference = session.get(PriceReference, reference_id)
    if not reference:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referencia no encontrada")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "price" and value is not None:
            value = round(value)
        setattr(reference, key, value)

    session.add(reference)
    session.commit()
    session.refresh(reference)
    return reference


@router.delete("/{reference_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_price_reference(
    reference_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    reference = session.get(PriceReference, reference_id)
    if not reference:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referencia no encontrada")
    session.delete(reference)
    session.commit()
    return None
