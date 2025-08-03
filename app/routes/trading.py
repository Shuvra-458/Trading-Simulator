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

    db_trade = models.Trade(
        user_id=current_user.id,
        symbol=trade.symbol.upper(),
        trade_type=TradeType[trade.trade_type],
        quantity=trade.quantity,
        price=trade.price
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
