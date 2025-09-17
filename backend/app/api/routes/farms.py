from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ...models import Farm, FarmCreate, FarmRead, FarmUpdate
from ..deps import get_current_active_user, get_session

router = APIRouter(prefix="/farms", tags=["farms"])


@router.get("/", response_model=list[FarmRead])
def list_farms(session: Session = Depends(get_session), _: object = Depends(get_current_active_user)):
    return session.exec(select(Farm)).all()


@router.post("/", response_model=FarmRead, status_code=status.HTTP_201_CREATED)
def create_farm(
    payload: FarmCreate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    farm = Farm.model_validate(payload)
    session.add(farm)
    session.commit()
    session.refresh(farm)
    return farm


@router.get("/{farm_id}", response_model=FarmRead)
def get_farm(
    farm_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    farm = session.get(Farm, farm_id)
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    return farm


@router.put("/{farm_id}", response_model=FarmRead)
def update_farm(
    farm_id: int,
    payload: FarmUpdate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    farm = session.get(Farm, farm_id)
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(farm, key, value)

    session.add(farm)
    session.commit()
    session.refresh(farm)
    return farm


@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_farm(
    farm_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    farm = session.get(Farm, farm_id)
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    session.delete(farm)
    session.commit()
    return None
