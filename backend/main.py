from fastapi import FastAPI, Depends,HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from services import moviesAPI as tmdb
from services import musicAPI
from services import gamesAPI
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Media
from schemas import MediaCreate, MediaResponse
from routers import takes


app = FastAPI()
app.include_router(takes.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # your teammate's dev server port
    allow_methods=["*"],
    allow_headers=["*"],
)

# Movies Routing
@app.get("/api/search/movies")
async def search_movies(q: str):
    try:
        return await tmdb.search_movies(q)
    except httpx.HTTPError as e:
        print("TMDB ERROR:", repr(e))
        raise HTTPException(status_code=502, detail="Upstream API failed Movie Search")


@app.get("/api/movies/{movie_id}")
async def movie_details(movie_id: str):
    try:
        return await tmdb.get_movie(movie_id)
    except httpx.HTTPError as e:
        print("TMDB ERROR:", repr(e))
        raise HTTPException(status_code=502, detail="Upstream API failed Movie ID")
    
# Tv Routing
@app.get("/api/search/tv")
async def search_tv(q: str):
    try:
        return await tmdb.search_tv(q)
    except httpx.HTTPError as e:
        print("TMDB ERROR:", repr(e))
        raise HTTPException(status_code=502, detail="Upstream API failed TV Search")


@app.get("/api/tv/{tv_id}")
async def tv_details(tv_id: str):
    try:
        return await tmdb.get_tv(tv_id)
    except httpx.HTTPError as e:
        print("TMDB ERROR:", repr(e))
        raise HTTPException(status_code=502, detail="Upstream API failed TV ID")


@app.get("/api/tv/{tv_id}/season/{season_number}")
async def tv_season(tv_id: str, season_number: int):
    try:
        return await tmdb.get_season(tv_id, season_number)
    except httpx.HTTPError as e:
        print("TMDB ERROR:", repr(e))
        raise HTTPException(status_code=502, detail="Upstream API failed Season ID")
 
 #Music routing   
@app.get("/api/search/music")
async def search_music(q: str):
    try:
        return await musicAPI.search_tracks(q)
    except httpx.HTTPError as e:
        print("SPOTIFY ERROR:", repr(e))
        raise HTTPException(status_code=502, detail="Upstream API failed Music Search")


@app.get("/api/music/{track_id}")
async def music_details(track_id: str):
    try:
        return await musicAPI.get_track(track_id)
    except httpx.HTTPError as e:
        print("SPOTIFY ERROR:", repr(e))
        raise HTTPException(status_code=502, detail="Upstream API failed Track ID")


#Games routing
@app.get("/api/search/games")
async def search_games(q: str):
    try:
        return await gamesAPI.search_games(q)
    except httpx.HTTPError as e:
        print("TWITCH ERROR:", repr(e))
        raise HTTPException(status_code=502, detail="Upstream API failed Games Search")


@app.get("/api/games/{game_id}")
async def game_details(game_id: str):
    try:
        game = await gamesAPI.get_game(game_id)
    except httpx.HTTPError as e:
        print("TWITCH ERROR:", repr(e))
        raise HTTPException(status_code=502, detail="Upstream API failed Games ID")
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return game

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
