from datetime import datetime, timedelta

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserCreate, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

MAX_ATTEMPTS = 3
LOCKOUT = timedelta(minutes=1)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
  """Use in any route that needs login. 401 if nobody is logged in."""
  user = db.get(User, request.session.get("user_id", 0))
  if user is None:
    raise HTTPException(401, "Not logged in")
  return user


@router.get("/me", response_model=UserOut)
def current_user(user: User = Depends(get_current_user)):
  return user


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: UserCreate, request: Request, db: Session = Depends(get_db)):
  if db.query(User).filter_by(username=body.username).first():
    raise HTTPException(409, "Username taken")
  hashed = bcrypt.hashpw(body.password.encode()[:72], bcrypt.gensalt()).decode()
  user = User(username=body.username, password_hash=hashed)
  db.add(user)
  db.commit()
  request.session["user_id"] = user.id
  return user


@router.post("/login", response_model=UserOut)
def login(body: UserCreate, request: Request, db: Session = Depends(get_db)):
  user = db.query(User).filter_by(username=body.username).first()
  if user is None:
    raise HTTPException(401, "Wrong username or password")

  # 3 misses in a row -> locked for 1 minute, then the count resets.
  if user.failed_login_attempts >= MAX_ATTEMPTS:
    if datetime.utcnow() - user.last_failed_login_at < LOCKOUT:
      raise HTTPException(429, "Too many attempts, wait a minute")
    user.failed_login_attempts = 0

  if not bcrypt.checkpw(body.password.encode()[:72], user.password_hash.encode()):
    user.failed_login_attempts += 1
    user.last_failed_login_at = datetime.utcnow()
    db.commit()
    raise HTTPException(401, "Wrong username or password")

  user.failed_login_attempts = 0
  db.commit()
  request.session["user_id"] = user.id
  return user


@router.post("/logout", status_code=204)
def logout(request: Request):
  request.session.clear()
