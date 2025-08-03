from pydantic import BaseModel, validator
from enum import Enum 
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TradeType(str, Enum):
    buy = "buy"
    sell = "sell"

class TradeCreate(BaseModel):
    symbol: str
    quantity: int
    price: float
    trade_type: TradeType
     
    @validator("trade_type")
    def validate_trade_type(cls, v):
        if v.lower() not in {"buy", "sell"}:
            raise ValueError("Invalid trade type")
        return v.upper()

class TradeOut(BaseModel):
    id: int
    symbol: str
    quantity: int
    price: float
    timestamp: datetime

    class Config:
        orm_mode = True
class PortfolioItem(BaseModel):
    symbol: str
    quantity: float
    avg_price: float
    class Config:
        orm_mode = True

class StockInfo(BaseModel):
    symbol: str
    name: str
    sector: str
    price: float

    class Config:
        orm_mode = True
