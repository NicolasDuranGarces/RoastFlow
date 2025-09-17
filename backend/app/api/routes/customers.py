from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ...models import Customer, CustomerCreate, CustomerRead, CustomerUpdate
from ..deps import get_current_active_user, get_session

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("/", response_model=list[CustomerRead])
def list_customers(session: Session = Depends(get_session), _: object = Depends(get_current_active_user)):
    return session.exec(select(Customer)).all()


@router.post("/", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    customer = Customer.model_validate(payload)
    session.add(customer)
    session.commit()
    session.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerRead)
def get_customer(
    customer_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    customer = session.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerRead)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    customer = session.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(customer, key, value)

    session.add(customer)
    session.commit()
    session.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    customer = session.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    session.delete(customer)
    session.commit()
    return None
