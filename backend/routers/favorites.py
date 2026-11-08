"""Favorites belong to the signed-in user, independently of take ratings."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import Favorite, MediaItem, User
from routers.auth import get_current_user
from schemas import MediaItemOut

router = APIRouter(prefix="/api/me/favorites", tags=["favorites"])


@router.get("", response_model=list[MediaItemOut])
def list_favorites(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
  favorites = db.scalars(select(Favorite).where(Favorite.user_id == user.id)
    .options(selectinload(Favorite.media_item))
    .order_by(Favorite.created_at.desc(), Favorite.id.desc())).all()
  return [favorite.media_item for favorite in favorites]


@router.put("/{media_id}", status_code=204)
def add_favorite(media_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
  if db.get(MediaItem, media_id) is None:
    raise HTTPException(404, "Media not found")
  existing = db.scalar(select(Favorite).where(
    Favorite.user_id == user.id, Favorite.media_item_id == media_id))
  if existing is None:
    db.add(Favorite(user_id=user.id, media_item_id=media_id))
    try:
      db.commit()
    except IntegrityError:
      db.rollback()
      # A concurrent request may already have saved this favorite.
      if db.scalar(select(Favorite).where(
        Favorite.user_id == user.id, Favorite.media_item_id == media_id)) is None:
        raise


@router.delete("/{media_id}", status_code=204)
def remove_favorite(media_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
  favorite = db.scalar(select(Favorite).where(
    Favorite.user_id == user.id, Favorite.media_item_id == media_id))
  if favorite is not None:
    db.delete(favorite)
    db.commit()
