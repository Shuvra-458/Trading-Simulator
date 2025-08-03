from app.database import engine
from app.db_base import Base
from app import models  # this line ensures models get registered

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

print("✅ Database reset successful!")
