from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from services import moviesAPI as tmdb

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # your teammate's dev server port
    allow_methods=["*"],
    allow_headers=["*"],
)


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