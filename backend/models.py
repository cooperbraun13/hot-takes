from datetime import datetime, date

from sqlalchemy import (
  Column, Integer, String, Float, Text, Date, DateTime, JSON,
  ForeignKey, UniqueConstraint, CheckConstraint,
)
from sqlalchemy.orm import relationship
from database import Base


# Cooper's original table. main.py's /api/media routes still use it.
# Remove once those routes are switched over to MediaItem.
class Media(Base):
  __tablename__ = "media"

  id = Column(Integer, primary_key=True)
  title = Column(String, nullable=False)
  type = Column(String, nullable=False)
  year = Column(Integer)
  description = Column(String)
  image_url = Column(String)


# ---------- MVP tables (see PROJECT_CONTEXT.md "Data model") ----------

class User(Base):
  __tablename__ = "users"

  id = Column(Integer, primary_key=True)
  username = Column(String, unique=True, nullable=False, index=True)
  password_hash = Column(String, nullable=False)   # bcrypt hash, never the real password
  failed_login_attempts = Column(Integer, nullable=False, default=0)
  created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

  takes = relationship("Take", back_populates="user")


class MediaItem(Base):
  """A movie/show/album/game we've saved locally so we don't refetch it from the API."""
  __tablename__ = "media_items"
  __table_args__ = (
    # The same TMDB movie can only be saved once.
    UniqueConstraint("external_source", "external_id", name="uq_media_source_id"),
  )

  id = Column(Integer, primary_key=True)
  media_type = Column(String, nullable=False)        # "movie" for the MVP
  external_source = Column(String, nullable=False)   # "tmdb"
  external_id = Column(String, nullable=False)       # TMDB's id for the movie
  title = Column(String, nullable=False)
  cover_url = Column(String)
  release_year = Column(Integer)
  extra_metadata = Column(JSON)

  takes = relationship("Take", back_populates="media_item")


class Take(Base):
  """One user's rating + comment on one media item."""
  __tablename__ = "takes"
  __table_args__ = (
    CheckConstraint("rating >= 0.5 AND rating <= 5", name="ck_rating_range"),
  )

  id = Column(Integer, primary_key=True)
  user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
  media_item_id = Column(Integer, ForeignKey("media_items.id"), nullable=False, index=True)
  rating = Column(Float, nullable=False)             # 0.5 to 5 in half steps
  comment = Column(Text)
  watched_on = Column(Date)
  created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

  user = relationship("User", back_populates="takes")
  media_item = relationship("MediaItem", back_populates="takes")
