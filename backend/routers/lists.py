"""Private, mixed-media lists owned by the signed-in user."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload
from database import get_db
from models import MediaList, ListEntry, User
from routers.auth import get_current_user
from routers.takes import get_or_create_media_item
from schemas import ListCreate, ListOut, MediaItemIn

router = APIRouter(prefix="/api", tags=["lists"])


def owned_list(db, user, list_id):
    result = db.scalar(select(MediaList).where(MediaList.id == list_id, MediaList.user_id == user.id))
    if result is None:
        raise HTTPException(404, "List not found")
    return result


@router.get("/me/lists", response_model=list[ListOut])
def my_lists(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(MediaList).where(MediaList.user_id == user.id)
        .options(selectinload(MediaList.entries).selectinload(ListEntry.media_item))
        .order_by(MediaList.created_at.desc(), MediaList.id.desc())).all()


@router.post("/lists", response_model=ListOut, status_code=201)
def create_list(body: ListCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    name = body.name.strip()
    if not name:
        raise HTTPException(422, "Enter a list name")
    result = MediaList(user_id=user.id, name=name)
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@router.post("/lists/{list_id}/items", response_model=ListOut, status_code=201)
def add_item(list_id: int, body: MediaItemIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    result = owned_list(db, user, list_id)
    if body.media_type not in {"movie", "tv", "music", "game", "book"}:
        raise HTTPException(422, "Unsupported media type")
    try:
        item = get_or_create_media_item(db, body)
        if db.scalar(select(ListEntry.id).where(ListEntry.list_id == list_id, ListEntry.media_item_id == item.id)):
            raise HTTPException(409, "This title is already in your list")
        db.add(ListEntry(list_id=list_id, media_item_id=item.id))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "This title is already saved; refresh and try again")
    db.refresh(result)
    return result


@router.delete("/lists/{list_id}/items/{entry_id}", status_code=204)
def remove_item(list_id: int, entry_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    owned_list(db, user, list_id)
    entry = db.scalar(select(ListEntry).where(ListEntry.id == entry_id, ListEntry.list_id == list_id))
    if entry is None:
        raise HTTPException(404, "List item not found")
    db.delete(entry)
    db.commit()
