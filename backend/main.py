from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from services import moviesAPI as tmdb
from services import musicAPI
from services import gamesAPI


app = FastAPI()

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
        raise HTTPException(status_code=502, detail="Upstream API failed")


@app.get("/api/movies/{movie_id}")
async def movie_details(movie_id: str):
    try:
        return await tmdb.get_movie(movie_id)
    except httpx.HTTPError as e:
        print("TMDB ERROR:", repr(e))
        raise HTTPException(status_code=502, detail="Upstream API failed")
 
 #Musics routing   
@app.get("/api/search/music")
async def search_music(q: str):
    try:
        return await musicAPI.search_tracks(q)
    except httpx.HTTPError as e:
        print("SPOTIFY ERROR:", repr(e))
        raise HTTPException(status_code=502, detail="Upstream API failed")


@app.get("/api/music/{track_id}")
async def music_details(track_id: str):
    try:
        return await musicAPI.get_track(track_id)
    except httpx.HTTPError as e:
        print("SPOTIFY ERROR:", repr(e))
        raise HTTPException(status_code=502, detail="Upstream API failed")


#Games routing
@app.get("/api/search/games")
async def search_games(q: str):
    try:
        return await gamesAPI.search_games(q)
    except httpx.HTTPError as e:
        print("TWITCH ERROR:", repr(e))
        raise HTTPException(status_code=502, detail="Upstream API failed")


@app.get("/api/games/{game_id}")
async def game_details(game_id: str):
    try:
        game = await gamesAPI.get_game(game_id)
    except httpx.HTTPError as e:
        print("TWITCH ERROR:", repr(e))
        raise HTTPException(status_code=502, detail="Upstream API failed")
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return game