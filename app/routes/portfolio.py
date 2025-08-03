from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import Transaction
from app.schemas import PortfolioItem
from typing import List

router = APIRouter(
    prefix="/portfolio",
    tags=["Portfolio"]
)

@router.get("/portfolio", response_model=List[schemas.PortfolioItem])
def get_portfolio(db: Session = Depends(get_db), user=Depends(get_current_user)):
    transactions = db.query(Transaction).filter(Transaction.user_id == user.id).all()

    if not transactions:
        return []

    portfolio = {}

    for txn in transactions:
        if txn.symbol not in portfolio:
            portfolio[txn.symbol] = {
                "quantity": 0,
                "avg_price": 0,
            }

        holding = portfolio[txn.symbol]

        if txn.transaction_type == "buy":
            total_cost = holding["avg_price"] * holding["quantity"] + txn.price * txn.quantity
            holding["quantity"] += txn.quantity
            holding["avg_price"] = total_cost / holding["quantity"]
        elif txn.transaction_type == "sell":
            holding["quantity"] -= txn.quantity
            if holding["quantity"] <= 0:
                holding["quantity"] = 0
                holding["avg_price"] = 0

    # Filter out sold-out holdings
    portfolio = {
        symbol: data for symbol, data in portfolio.items() if data["quantity"] > 0
    }

    return [
        PortfolioItem(
            symbol=symbol,
            quantity=data["quantity"],
            avg_price=data["avg_price"]
        )
        for symbol, data in portfolio.items()
    ]
