from datetime import date
from typing import Optional

from sqlmodel import SQLModel


class RoastedInventoryEntry(SQLModel):
    roast_id: int
    roast_date: date
    roast_level: Optional[str] = None
    lot_id: int
    lot_process: str
    farm_name: str
    variety_name: str
    green_input_g: float
    roasted_output_g: float
    sold_g: float
    adjustments_g: float
    available_g: float
    shrinkage_pct: float
    notes: Optional[str] = None
