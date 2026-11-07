import os 
import httpx
from dotenv import load_dotenv

load_dotenv()

BASE = "https://api.themoviedb.org/3"
IMG = "https://image.tmdb.org/t/p/w500"

#should get an image link, if there isn't an image should return none
def _img(path, size="w500"):
    if path:
        return f"{IMG}/{size}{path}" if path else None

# Makes the API request with parameters returns JSON if request fails throw error
async def _get(path, **params):
    params["api_key"] = os.getenv("MOVIES_TV")
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{BASE}/{path}", params=params)
        res.raise_for_status()
        return res.json()
    
# Returns a list of movies that match the entry
async def search_movies(query: str):
    data = await _get("/search/movie", query=query)
    return [
        {
            "id": str(m["id"]),
            "title": m["title"],
            "subtitle": (m.get("release_date") or "")[:4],
            "overview": m.get("overview"),
            "rating": m.get("vote_average"),
            "imageUrl": _img(m.get("poster_path")),
            "source": "tmdb",
        }
        for m in data["results"]
    ]

#returns the videos youtube id based off of the movie id, we can use this to have the video on site
async def get_movie(movie_id: str):
    m = await _get(f"/movie/{movie_id}", append_to_response="credits,videos")

    trailer = next(
        (v for v in m["videos"]["results"]
         if v["site"] == "YouTube" and v["type"] == "Trailer"),
        None,
    )

    return {
        "id": str(m["id"]),
        "title": m["title"],
        "tagline": m.get("tagline"),
        "overview": m.get("overview"),
        "releaseDate": m.get("release_date"),
        "runtime": m.get("runtime"),
        "rating": m.get("vote_average"),
        "genres": [g["name"] for g in m["genres"]],
        "posterUrl": _img(m.get("poster_path")),
        "backdropUrl": _img(m.get("backdrop_path"), "w1280"),
        "trailerKey": trailer["key"] if trailer else None,
        "cast": [
            {
                "name": c["name"],
                "character": c["character"],
                "photoUrl": _img(c.get("profile_path"), "w185"),
            }
            for c in m["credits"]["cast"][:10]
        ],
        "source": "tmdb",
    }