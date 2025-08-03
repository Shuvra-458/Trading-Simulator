from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database, auth
from collections import defaultdict
from typing import List
from ..utils.stock_price import get_stock_price
from app.models import TradeType

router = APIRouter(prefix="/trade", tags=["Trading"])

@router.post("/", response_model=schemas.TradeOut)
def execute_trade(trade: schemas.TradeCreate,
                  db: Session = Depends(database.get_db),
                  current_user: models.User = Depends(auth.get_current_user)):

    symbol = trade.symbol.upper()
    quantity = trade.quantity
    price = trade.price
    trade_type = TradeType[trade.trade_type.upper()]

    if quantity <= 0 or price <= 0:
        raise HTTPException(status_code=400, detail="Quantity and price must be greater than 0.")

    # Get user and their portfolio for this stock
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    portfolio_item = db.query(models.Portfolio).filter_by(user_id=user.id, symbol=symbol).first()

    # Handle BUY trade
    if trade_type == TradeType.BUY:
        total_cost = price * quantity

        if user.balance < total_cost:
            raise HTTPException(status_code=400, detail="Insufficient balance to execute this trade.")

        # Deduct balance
        user.balance -= total_cost

        if portfolio_item:
            total_qty = portfolio_item.quantity + quantity
            portfolio_item.avg_price = (
                (portfolio_item.quantity * portfolio_item.avg_price + total_cost) / total_qty
            )
            portfolio_item.quantity = total_qty
        else:
            portfolio_item = models.Portfolio(
                user_id=user.id,
                symbol=symbol,
                quantity=quantity,
                avg_price=price
            )
            db.add(portfolio_item)

    # Handle SELL trade
    elif trade_type == TradeType.SELL:
        if not portfolio_item or portfolio_item.quantity < quantity:
            raise HTTPException(status_code=400, detail="Not enough shares to sell.")

        proceeds = price * quantity
        user.balance += proceeds

        portfolio_item.quantity -= quantity

        # Delete if quantity becomes 0
        if portfolio_item.quantity == 0:
            db.delete(portfolio_item)

    # Record the trade
    db_trade = models.Trade(
        user_id=user.id,
        symbol=symbol,
        trade_type=trade_type,
        quantity=quantity,
        price=price
    )

    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)

    return db_trade

@router.get("/history", response_model=List[schemas.TradeOut])
def get_trade_history(db: Session = Depends(database.get_db),
                      current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Trade).filter(models.Trade.user_id == current_user.id).order_by(models.Trade.timestamp.desc()).all()

@router.get("/portfolio", response_model=List[schemas.PortfolioItem])
def get_portfolio(db: Session = Depends(database.get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    trades = db.query(models.Trade).filter(models.Trade.user_id == current_user.id).all()
    
    portfolio = defaultdict(lambda: {"qty": 0, "total_cost": 0})

    for t in trades:
        sym = t.symbol.upper()
        if t.trade_type == models.TradeType.BUY:
            portfolio[sym]["qty"] += t.quantity
            portfolio[sym]["total_cost"] += t.quantity * t.price
        elif t.trade_type == models.TradeType.SELL:
            portfolio[sym]["qty"] -= t.quantity
            portfolio[sym]["total_cost"] -= t.quantity * t.price

    result = []
    for symbol, data in portfolio.items():
        if data["qty"] > 0:
            result.append(schemas.PortfolioItem(
                symbol=symbol,
                quantity=round(data["qty"], 2),
                avg_price=round(data["total_cost"] / data["qty"], 2)
            ))

    return result
