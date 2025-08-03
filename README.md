# 💹 Trading Simulation Platform

A FastAPI-powered backend that simulates real-time stock trading using live prices (Finnhub API).

## Features
- Register/Login with JWT Auth
- View Live Stock Prices
- Buy/Sell US Stocks
- Track Portfolio
- Fully modular and production-ready

## Tech Stack
- Python(FastAPI + PyDantic)
- MySQL
- JWT Auth
- Finnhub API

## Getting Started

```bash
git clone https://github.com/Shuvra-458/trading-simulator.git
cd trading-simulator
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
