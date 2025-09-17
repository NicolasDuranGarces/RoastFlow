from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ...models import Variety, VarietyCreate, VarietyRead, VarietyUpdate
from ..deps import get_current_active_user, get_session

router = APIRouter(prefix="/varieties", tags=["varieties"])


@router.get("/", response_model=list[VarietyRead])
def list_varieties(session: Session = Depends(get_session), _: object = Depends(get_current_active_user)):
    return session.exec(select(Variety)).all()


@router.post("/", response_model=VarietyRead, status_code=status.HTTP_201_CREATED)
def create_variety(
    payload: VarietyCreate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    variety = Variety.model_validate(payload)
    session.add(variety)
    session.commit()
    session.refresh(variety)
    return variety


@router.get("/{variety_id}", response_model=VarietyRead)
def get_variety(
    variety_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    variety = session.get(Variety, variety_id)
    if not variety:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variety not found")
    return variety


@router.put("/{variety_id}", response_model=VarietyRead)
def update_variety(
    variety_id: int,
    payload: VarietyUpdate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    variety = session.get(Variety, variety_id)
    if not variety:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variety not found")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(variety, key, value)

    session.add(variety)
    session.commit()
    session.refresh(variety)
    return variety


@router.delete("/{variety_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_variety(
    variety_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    variety = session.get(Variety, variety_id)
    if not variety:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variety not found")
    session.delete(variety)
    session.commit()
    return None
