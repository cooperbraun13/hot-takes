from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

engine = create_engine("sqlite:///./media.db")
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()