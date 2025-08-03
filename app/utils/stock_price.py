import finnhub
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("FINNHUB_API_KEY")
finnhub_client = finnhub.Client(api_key=api_key)

def get_stock_price(symbol: str) -> float:
    try:
        quote = finnhub_client.quote(symbol)
        return round(quote['c'], 2)  # 'c' = current price
    except Exception as e:
        print(f"Error fetching stock price for {symbol}: {e}")
        return 0.0
