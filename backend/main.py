from fastapi import FastAPI, Depends, HTTPException, Query
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware
import httpx
from services import moviesAPI as tmdb
from services import musicAPI
from services import gamesAPI
from services.discovery import discover, media_item
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal, engine, Base
from models import Media
from schemas import MediaCreate, MediaResponse, GridGuess
from grid_game import CLUES, matches_clue, new_grid
from schemas import MediaCreate, MediaResponse
from routers import takes, auth
from starlette.middleware.sessions import SessionMiddleware
import os
from dotenv import load_dotenv

load_dotenv()


app = FastAPI()
app.include_router(auth.router)
app.include_router(takes.router)

# Login cookie. SECRET_KEY signs it so nobody can fake being another user.
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY", "dev-only-change-me"),
    same_site="lax",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

@app.get("/api/grid")
def get_grid():
  return new_grid()

@app.post("/api/grid/guess")
async def check_grid_guess(guess: GridGuess):
  if guess.row_id not in CLUES or guess.column_id not in CLUES:
    raise HTTPException(status_code=400, detail="Unknown grid clue")
  if not guess.movie_id.isascii() or not guess.movie_id.isdecimal() or len(guess.movie_id) > 12:
    raise HTTPException(status_code=400, detail="Invalid movie ID")

  try:
    movie = await tmdb.get_movie_grid_facts(guess.movie_id)
  except httpx.HTTPStatusError as error:
    if error.response.status_code == 404:
      raise HTTPException(status_code=404, detail="Movie not found") from error
    raise HTTPException(status_code=502, detail="Movie lookup failed") from error
  except httpx.HTTPError as error:
    raise HTTPException(status_code=502, detail="Movie lookup failed") from error

  return {
    "correct": matches_clue(movie, CLUES[guess.row_id]) and matches_clue(movie, CLUES[guess.column_id]),
    "movie": {"id": movie["id"], "title": movie["title"], "year": movie["release_date"][:4]},
  }
    
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

@app.get("/api/discover/{media_type}")
async def discover_media(
    media_type: Literal["movie", "tv", "game", "music", "book"],
    limit: int = Query(default=4, ge=1, le=10),
    db: Session = Depends(get_db),
):
    if media_type == "book":
        books = db.execute(text(
            "SELECT id, title, year, description, cover_url FROM books ORDER BY rowid LIMIT :limit"
        ), {"limit": limit}).mappings().all()
        return [media_item("book", "local", b["id"], b["title"], b["cover_url"],
                           b["year"], b["description"]) for b in books]
    try:
        return await discover(media_type, limit)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not load media from the upstream API")

# Books are populated with sql/seed_books.sql.
@app.get("/api/books/{book_id}")
def book_details(book_id: str, db: Session = Depends(get_db)):
  book = db.execute(
    text("SELECT id, title, author, year, description, cover_url FROM books WHERE id = :id"),
    {"id": book_id},
  ).mappings().first()
  if book is None:
    raise HTTPException(status_code=404, detail="Book not found")
  return dict(book)
    
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
