from datetime import date
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class FarmBase(SQLModel):
    name: str = Field(index=True)
    location: Optional[str] = None
    notes: Optional[str] = None


class Farm(FarmBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class FarmCreate(FarmBase):
    pass


class FarmRead(FarmBase):
    id: int


class FarmUpdate(SQLModel):
    name: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class VarietyBase(SQLModel):
    name: str = Field(index=True)
    description: Optional[str] = None


class Variety(VarietyBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class VarietyCreate(VarietyBase):
    pass


class VarietyRead(VarietyBase):
    id: int


class VarietyUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CoffeeLotBase(SQLModel):
    farm_id: int = Field(foreign_key="farm.id")
    variety_id: int = Field(foreign_key="variety.id")
    process: str
    purchase_date: date
    green_weight_g: float
    price_per_kg: float
    moisture_level: Optional[float] = None
    notes: Optional[str] = None


class CoffeeLot(CoffeeLotBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class CoffeeLotCreate(CoffeeLotBase):
    pass


class CoffeeLotRead(CoffeeLotBase):
    id: int


class CoffeeLotUpdate(SQLModel):
    farm_id: Optional[int] = None
    variety_id: Optional[int] = None
    process: Optional[str] = None
    purchase_date: Optional[date] = None
    green_weight_g: Optional[float] = None
    price_per_kg: Optional[float] = None
    moisture_level: Optional[float] = None
    notes: Optional[str] = None


class RoastBatchBase(SQLModel):
    lot_id: int = Field(foreign_key="coffeelot.id")
    roast_date: date
    green_input_g: float
    roasted_output_g: float
    roast_level: Optional[str] = None
    notes: Optional[str] = None


class RoastBatch(RoastBatchBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    shrinkage_pct: float = 0.0


class RoastBatchCreate(RoastBatchBase):
    pass


class RoastBatchRead(RoastBatchBase):
    id: int
    shrinkage_pct: float


class RoastBatchUpdate(SQLModel):
    lot_id: Optional[int] = None
    roast_date: Optional[date] = None
    green_input_g: Optional[float] = None
    roasted_output_g: Optional[float] = None
    roast_level: Optional[str] = None
    notes: Optional[str] = None


class CustomerBase(SQLModel):
    name: str
    contact_info: Optional[str] = None


class Customer(CustomerBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class CustomerCreate(CustomerBase):
    pass


class CustomerRead(CustomerBase):
    id: int


class CustomerUpdate(SQLModel):
    name: Optional[str] = None
    contact_info: Optional[str] = None


class SaleBase(SQLModel):
    customer_id: Optional[int] = Field(default=None, foreign_key="customer.id")
    sale_date: date
    notes: Optional[str] = None


class Sale(SaleBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    total_price: float = 0.0
    total_quantity_g: float = 0.0
    items: List["SaleItem"] = Relationship(
        back_populates="sale",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class SaleCreate(SaleBase):
    items: list["SaleItemCreate"]


class SaleRead(SaleBase):
    id: int
    total_price: float
    total_quantity_g: float
    items: list["SaleItemRead"]


class SaleUpdate(SQLModel):
    customer_id: Optional[int] = None
    sale_date: Optional[date] = None
    notes: Optional[str] = None
    items: Optional[list["SaleItemCreate"]] = None


class SaleItemBase(SQLModel):
    roast_batch_id: int = Field(foreign_key="roastbatch.id")
    bag_size_g: int
    bags: int = 1
    bag_price: float
    notes: Optional[str] = None


class SaleItem(SaleItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sale_id: int = Field(foreign_key="sale.id")
    sale: Optional["Sale"] = Relationship(back_populates="items")


class SaleItemCreate(SaleItemBase):
    pass


class SaleItemRead(SaleItemBase):
    id: int
    sale_id: int


Sale.model_rebuild()
SaleCreate.model_rebuild()
SaleRead.model_rebuild()
SaleUpdate.model_rebuild()
SaleItemCreate.model_rebuild()
SaleItemRead.model_rebuild()


class ExpenseBase(SQLModel):
    expense_date: date
    category: str
    amount: float
    notes: Optional[str] = None


class Expense(ExpenseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseRead(ExpenseBase):
    id: int


class ExpenseUpdate(SQLModel):
    expense_date: Optional[date] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    notes: Optional[str] = None
