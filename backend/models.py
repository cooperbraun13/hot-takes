from sqlalchemy import Column, Integer, String
from database import Base

class Media(Base):
  __tablename__ = "media"

  id = Column(Integer, primary_key=True)
  title = Column(String, nullable=False)
  type = Column(String, nullable=False)
  year = Column(Integer)
  description = Column(String)
  image_url = Column(String)