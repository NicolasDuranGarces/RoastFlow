from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ...models import RoastBatch, RoastBatchCreate, RoastBatchRead, RoastBatchUpdate
from ..deps import get_current_active_user, get_session

router = APIRouter(prefix="/roasts", tags=["roasts"])


def _calculate_shrinkage(green_input: float, roasted_output: float) -> float:
    if green_input <= 0:
        return 0.0
    loss = green_input - roasted_output
    return (loss / green_input) * 100


@router.get("/", response_model=list[RoastBatchRead])
def list_roasts(session: Session = Depends(get_session), _: object = Depends(get_current_active_user)):
    return session.exec(select(RoastBatch)).all()


@router.post("/", response_model=RoastBatchRead, status_code=status.HTTP_201_CREATED)
def create_roast(
    payload: RoastBatchCreate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    if payload.green_input_g <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Green input must be greater than zero")

    roast = RoastBatch.model_validate(payload)
    roast.shrinkage_pct = _calculate_shrinkage(roast.green_input_g, roast.roasted_output_g)
    session.add(roast)
    session.commit()
    session.refresh(roast)
    return roast


@router.get("/{roast_id}", response_model=RoastBatchRead)
def get_roast(
    roast_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    roast = session.get(RoastBatch, roast_id)
    if not roast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roast not found")
    return roast


@router.put("/{roast_id}", response_model=RoastBatchRead)
def update_roast(
    roast_id: int,
    payload: RoastBatchUpdate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    roast = session.get(RoastBatch, roast_id)
    if not roast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roast not found")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(roast, key, value)

    if roast.green_input_g <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Green input must be greater than zero")

    roast.shrinkage_pct = _calculate_shrinkage(roast.green_input_g, roast.roasted_output_g)

    session.add(roast)
    session.commit()
    session.refresh(roast)
    return roast


@router.delete("/{roast_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_roast(
    roast_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    roast = session.get(RoastBatch, roast_id)
    if not roast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roast not found")
    session.delete(roast)
    session.commit()
    return None
