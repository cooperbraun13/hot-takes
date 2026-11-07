# API endpoints
import httpx
from fastapi import HTTPException
from services import tmdb

@app.get("/api/search/movies")
async def search_movies(q: str):
    try:
        return await tmdb.search_movies(q)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Upstream API failed")


@app.get("/api/movies/{movie_id}")
async def movie_details(movie_id: str):
    try:
        return await tmdb.get_movie(movie_id)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Upstream API failed")