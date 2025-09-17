from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ...models import Expense, ExpenseCreate, ExpenseRead, ExpenseUpdate
from ..deps import get_current_active_user, get_session

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("/", response_model=list[ExpenseRead])
def list_expenses(session: Session = Depends(get_session), _: object = Depends(get_current_active_user)):
    return session.exec(select(Expense)).all()


@router.post("/", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    expense = Expense.model_validate(payload)
    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense


@router.get("/{expense_id}", response_model=ExpenseRead)
def get_expense(
    expense_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


@router.put("/{expense_id}", response_model=ExpenseRead)
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(expense, key, value)

    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(get_current_active_user),
):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    session.delete(expense)
    session.commit()
    return None
