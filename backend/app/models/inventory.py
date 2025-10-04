from datetime import date, datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class RoastInventoryAdjustmentBase(SQLModel):
    roast_batch_id: int = Field(foreign_key="roastbatch.id")
    adjustment_g: float
    reason: Optional[str] = None
    adjustment_date: date = Field(default_factory=date.today)


class RoastInventoryAdjustment(RoastInventoryAdjustmentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class RoastInventoryAdjustmentCreate(RoastInventoryAdjustmentBase):
    pass


class RoastInventoryAdjustmentRead(RoastInventoryAdjustmentBase):
    id: int
    created_at: datetime


class RoastInventoryAdjustmentUpdate(SQLModel):
    roast_batch_id: Optional[int] = None
    adjustment_g: Optional[float] = None
    reason: Optional[str] = None
    adjustment_date: Optional[date] = None
