"""Routes for logging and listing takes.

POST /api/takes      log a movie with a rating + comment
GET  /api/me/takes   list everything the current user has logged
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from database import get_db
from routers.auth import get_current_user
from models import MediaItem, Take, User
from schemas import TakeCreate, TakeOut

router = APIRouter(prefix="/api", tags=["takes"])


def get_or_create_media_item(db: Session, data) -> MediaItem:
  """Find this movie in media_items, or save it the first time anyone logs it."""
  item = db.scalars(
    select(MediaItem).where(
      MediaItem.external_source == data.external_source,
      MediaItem.external_id == data.external_id,
    )
  ).first()

  if item is None:
    item = MediaItem(
      media_type=data.media_type,
      external_source=data.external_source,
      external_id=data.external_id,
      title=data.title,
      release_year=data.year,
      cover_url=data.cover_url,
    )
    db.add(item)
    db.flush()   # gives item an id without committing yet
  return item


@router.post("/takes", response_model=TakeOut, status_code=201)
def create_take(
  body: TakeCreate,
  db: Session = Depends(get_db),
  user: User = Depends(get_current_user),
):
  """Log a movie: save the movie if it's new, then save the take."""
  item = get_or_create_media_item(db, body.media)

  take = Take(
    user_id=user.id,
    media_item_id=item.id,
    rating=body.rating,
    comment=body.comment,
    watched_on=body.watched_on,
  )
  db.add(take)
  db.commit()
  db.refresh(take)
  return take


@router.get("/me/takes", response_model=list[TakeOut])
def list_my_takes(
  db: Session = Depends(get_db),
  user: User = Depends(get_current_user),
):
  """Everything the current user has logged, newest first."""
  return db.scalars(
    select(Take)
    .where(Take.user_id == user.id)
    .options(selectinload(Take.media_item))
    .order_by(Take.created_at.desc())
  ).all()
