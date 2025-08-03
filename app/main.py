from fastapi import FastAPI
from . import models, database
from .routes import users, trading
from app.routes import stocks
import pymysql
pymysql.install_as_MySQLdb()


app = FastAPI(title="Trading Simulator API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=database.engine)

app.include_router(users.router)
app.include_router(trading.router)
app.include_router(stocks.router)
