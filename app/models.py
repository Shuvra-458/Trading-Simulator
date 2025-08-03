from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from .db_base import Base
from enum import Enum

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    hashed_password = Column(String(255))
    balance = Column(Float, default=100000.0)  # Starting cash
    trades = relationship("Trade", back_populates="owner")

class TradeType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class Trade(Base):
    __tablename__ = "trades"
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), nullable = False)
    quantity = Column(Integer)
    price = Column(Float)

    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    trade_type = Column(SQLEnum(TradeType), nullable=False)
    owner = relationship("User", back_populates="trades")

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    sector = Column(String(255))
    price = Column(Float)  # Initial price or reference price

