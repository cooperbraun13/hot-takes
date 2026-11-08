from importlib.resources import path
import os
from xmlrpc import client
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
       res = await client.get(f"{BASE}/{path.lstrip('/')}", params=params)
       res.raise_for_status()
       return res.json()
  
# Returns a list of movies that match the entry
async def search_movies(query: str):
   data = await _get("/search/movie", query=query)
   return [
       {    
           "external_id": str(m["id"]),
           "title": m["title"],
           "year": (m.get("release_date") or "")[:4],
           "overview": m.get("overview"),
           "rating": m.get("vote_average"),
           "cover_Url": _img(m.get("poster_path")),
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
       "external_id": str(m["id"]),
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
  
   # Returns a list of TV shows that match the search
async def search_tv(query: str):
   data = await _get("/search/tv", query=query)
   return [
       {
           "external_id": str(s["id"]),
           "title": s["name"],
           "year": (s.get("first_air_date") or "")[:4],
           "overview": s.get("overview"),
           "rating": s.get("vote_average"),
           "cover_Url": _img(s.get("poster_path")),
           "source": "tmdb",
       }
       for s in data["results"]
   ]




# Returns full details for one TV show, including the YouTube trailer key
async def get_tv(tv_id: str):
   s = await _get(f"/tv/{tv_id}", append_to_response="credits,videos")


   trailer = next(
       (v for v in s["videos"]["results"]
        if v["site"] == "YouTube" and v["type"] == "Trailer"),
       None,
   )


   return {
       "external_id": str(s["id"]),
       "title": s["name"],
       "tagline": s.get("tagline"),
       "overview": s.get("overview"),
       "firstAirDate": s.get("first_air_date"),
       "lastAirDate": s.get("last_air_date"),
       "status": s.get("status"),
       "numberOfSeasons": s.get("number_of_seasons"),
       "numberOfEpisodes": s.get("number_of_episodes"),
       "rating": s.get("vote_average"),
       "genres": [g["name"] for g in s["genres"]],
       "networks": [n["name"] for n in s.get("networks", [])],
       "creators": [c["name"] for c in s.get("created_by", [])],
       "posterUrl": _img(s.get("poster_path")),
       "backdropUrl": _img(s.get("backdrop_path"), "w1280"),
       "trailerKey": trailer["key"] if trailer else None,
       "seasons": [
           {
               "seasonNumber": se["season_number"],
               "name": se["name"],
               "episodeCount": se["episode_count"],
               "airDate": se.get("air_date"),
               "posterUrl": _img(se.get("poster_path")),
           }
           for se in s["seasons"]
       ],
       "cast": [
           {
               "name": c["name"],
               "character": c["character"],
               "photoUrl": _img(c.get("profile_path"), "w185"),
           }
           for c in s["credits"]["cast"][:10]
       ],
       "source": "tmdb",
   }




# Returns the episode list for one season of a show
async def get_season(tv_id: str, season_number: int):
   se = await _get(f"/tv/{tv_id}/season/{season_number}")
   return {
       "seasonNumber": se["season_number"],
       "name": se["name"],
       "overview": se.get("overview"),
       "episodes": [
           {
               "episodeNumber": e["episode_number"],
               "name": e["name"],
               "overview": e.get("overview"),
               "airDate": e.get("air_date"),
               "runtime": e.get("runtime"),
               "rating": e.get("vote_average"),
               "stillUrl": _img(e.get("still_path"), "w300"),
           }
           for e in se["episodes"]
       ],
   }
