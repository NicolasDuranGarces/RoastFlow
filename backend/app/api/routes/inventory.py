from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.sql import Select
from sqlmodel import Session, select

from ...models import (
    CoffeeLot,
    Farm,
    RoastBatch,
    RoastInventoryAdjustment,
    RoastInventoryAdjustmentCreate,
    RoastInventoryAdjustmentRead,
    RoastInventoryAdjustmentUpdate,
    SaleItem,
    Variety,
)
from ...schemas.inventory import RoastedInventoryEntry
from ..deps import get_current_active_user, get_session

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/roasted", response_model=list[RoastedInventoryEntry])
def list_roasted_inventory(
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
) -> list[RoastedInventoryEntry]:
    sold_subquery = (
        select(
            SaleItem.roast_batch_id,
            func.coalesce(func.sum(SaleItem.bag_size_g * SaleItem.bags), 0.0).label("sold_g"),
        )
        .group_by(SaleItem.roast_batch_id)
        .subquery()
    )

    adjustments_subquery = (
        select(
            RoastInventoryAdjustment.roast_batch_id,
            func.coalesce(func.sum(RoastInventoryAdjustment.adjustment_g), 0.0).label("adjustments_g"),
        )
        .group_by(RoastInventoryAdjustment.roast_batch_id)
        .subquery()
    )

    statement: Select = (
        select(
            RoastBatch.id,
            RoastBatch.roast_date,
            RoastBatch.roast_level,
            RoastBatch.green_input_g,
            RoastBatch.roasted_output_g,
            RoastBatch.shrinkage_pct,
            RoastBatch.notes,
            CoffeeLot.id.label("lot_id"),
            CoffeeLot.process,
            Farm.name.label("farm_name"),
            Variety.name.label("variety_name"),
            func.coalesce(sold_subquery.c.sold_g, 0.0).label("sold_g"),
            func.coalesce(adjustments_subquery.c.adjustments_g, 0.0).label("adjustments_g"),
        )
        .join(CoffeeLot, CoffeeLot.id == RoastBatch.lot_id)
        .join(Farm, Farm.id == CoffeeLot.farm_id)
        .join(Variety, Variety.id == CoffeeLot.variety_id)
        .join(sold_subquery, sold_subquery.c.roast_batch_id == RoastBatch.id, isouter=True)
        .join(adjustments_subquery, adjustments_subquery.c.roast_batch_id == RoastBatch.id, isouter=True)
        .order_by(RoastBatch.roast_date.desc(), RoastBatch.id.desc())
    )

    rows = session.exec(statement).all()

    inventory: list[RoastedInventoryEntry] = []
    for row in rows:
        (
            roast_id,
            roast_date,
            roast_level,
            green_input_g,
            roasted_output_g,
            shrinkage_pct,
            notes,
            lot_id,
            process,
            farm_name,
            variety_name,
            sold_g,
            adjustments_g,
        ) = row
        available_g = float(roasted_output_g) - float(sold_g) + float(adjustments_g)
        inventory.append(
            RoastedInventoryEntry(
                roast_id=roast_id,
                roast_date=roast_date,
                roast_level=roast_level,
                lot_id=lot_id,
                lot_process=process,
                farm_name=farm_name,
                variety_name=variety_name,
                green_input_g=float(green_input_g),
                roasted_output_g=float(roasted_output_g),
                sold_g=float(sold_g),
                adjustments_g=float(adjustments_g),
                available_g=available_g,
                shrinkage_pct=float(shrinkage_pct or 0.0),
                notes=notes,
            )
        )

    return inventory


@router.get("/adjustments", response_model=list[RoastInventoryAdjustmentRead])
def list_adjustments(
    roast_id: int | None = Query(default=None),
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
) -> list[RoastInventoryAdjustmentRead]:
    statement = select(RoastInventoryAdjustment)
    if roast_id is not None:
        statement = statement.where(RoastInventoryAdjustment.roast_batch_id == roast_id)
    statement = statement.order_by(
        RoastInventoryAdjustment.adjustment_date.desc(),
        RoastInventoryAdjustment.id.desc(),
    )
    return session.exec(statement).all()


@router.post("/adjustments", response_model=RoastInventoryAdjustmentRead, status_code=status.HTTP_201_CREATED)
def create_adjustment(
    payload: RoastInventoryAdjustmentCreate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
) -> RoastInventoryAdjustmentRead:
    if abs(payload.adjustment_g) < 1e-6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El ajuste no puede ser cero")

    roast = session.get(RoastBatch, payload.roast_batch_id)
    if not roast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tostión no encontrada")

    adjustment = RoastInventoryAdjustment.model_validate(payload)
    session.add(adjustment)
    session.commit()
    session.refresh(adjustment)
    return adjustment


@router.put("/adjustments/{adjustment_id}", response_model=RoastInventoryAdjustmentRead)
def update_adjustment(
    adjustment_id: int,
    payload: RoastInventoryAdjustmentUpdate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
) -> RoastInventoryAdjustmentRead:
    adjustment = session.get(RoastInventoryAdjustment, adjustment_id)
    if not adjustment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ajuste no encontrado")

    update_data = payload.model_dump(exclude_unset=True)

    if "adjustment_g" in update_data and abs(update_data["adjustment_g"]) < 1e-6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El ajuste no puede ser cero")

    if "roast_batch_id" in update_data:
        roast = session.get(RoastBatch, update_data["roast_batch_id"])
        if not roast:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tostión no encontrada")

    for key, value in update_data.items():
        setattr(adjustment, key, value)

    session.add(adjustment)
    session.commit()
    session.refresh(adjustment)
    return adjustment


@router.delete("/adjustments/{adjustment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_adjustment(
    adjustment_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
) -> None:
    adjustment = session.get(RoastInventoryAdjustment, adjustment_id)
    if not adjustment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ajuste no encontrado")

    session.delete(adjustment)
    session.commit()
    return None
