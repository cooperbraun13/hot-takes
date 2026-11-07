from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Media
from schemas import MediaCreate, MediaResponse

app = FastAPI()

# create database tables
Base.metadata.create_all(bind=engine)

# get database connection
def get_db():
  with SessionLocal() as db:
    yield db
    
# get all media
@app.get("/app/media", response_model=list[MediaResponse])
def get_media(db: Session = Depends(get_db)):
  return db.query(Media).all()

# get specific media
@app.get("/app/media/{media_id}", response_model=MediaResponse)
def get_media_by_id(media_id: int, db: Session = Depends(get_db)):
  media = db.get(Media, media_id)
  
  if not media:
    raise HTTPException(status_code=404, detail="Media not found")
  
  return media

# create media
@app.post("/api/media", response_model=MediaResponse, status_code=201)
def create_media(media: MediaCreate, db: Session = Depends(get_db)):
  item = Media(**media.model_dump())
  
  db.add(item)
  db.commit()
  db.refresh(item)
  
  return item