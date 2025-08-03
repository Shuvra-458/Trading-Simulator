from fastapi import APIRouter
from app.utils.stock_price import get_stock_price

router = APIRouter(
    prefix="/stocks",
    tags=["Stocks"]
)

AVAILABLE_STOCKS = {
    "AAPL": "Apple Inc.",
    "TSLA": "Tesla Inc.",
    "GOOGL": "Alphabet Inc.(Google)",
    "AMZN" : "Amazon.com Inc.",
    "META" : "Meta Platforms Inc.",
    "NVDA" : "NVIDIA Corp.",    
    "INTC" : "Intel Corp.",
    "AMD"  : "AMD(Advanced Micro)",
    "CSCO" : "Cisco Systems",
    "JPM"  : "JPMorgan Chase",
    "BAC"  : "Bank of America",
    "GS"   : "Goldman Sachs",
    "MS"   : "Morgan Stanley",
    "WFC"  : "Wells Fargo",
    "JNJ"  : "Johnson & Johnson",
    "PFE"  : "Pfizer Inc.",
    "MRNA" : "Moderna Inc.",
    "LLY"  : "Eli Lilly",
    "WMT"  : "Walmart Inc.",
    "COST" : "Costco Wholesale",
    "HD"   : "Home Depot",
    "NKE"  : "Nike Inc.",
    "MCD"  : "McDonald's Corp.",
    "XOM"  : "ExxonMobil",
    "CVX"  : "Chevron Corp."
    }

@router.get("/")
def list_available_stocks():
    stock_list = []
    for symbol, name in AVAILABLE_STOCKS.items():
        current_price = get_stock_price(symbol)
        stock_list.append({
            "symbol": symbol,
            "name": name,
            "price": current_price
        })
    return stock_list
