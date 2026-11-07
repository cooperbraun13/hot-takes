import os
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

TOKEN_URL = "https://id.twitch.tv/oauth2/token"
BASE = "https://api.twitch.tv/helix"

# Cached token so we don't request a new one on every search
_token = None
_expires_at = 0


# Gets an app access token, reuses it until about a minute before it expires
async def _get_token():
    global _token, _expires_at

    if _token and time.time() < _expires_at - 60:
        return _token

    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.post(
            TOKEN_URL,
            data={
                "client_id": os.getenv("GAMES_CLIENT_ID"),
                "client_secret": os.getenv("GAMES_CLIENT_SECRET"),
                "grant_type": "client_credentials",
            },
        )
        res.raise_for_status()
        data = res.json()

    _token = data["access_token"]
    _expires_at = time.time() + data["expires_in"]
    return _token


# Makes an authenticated request to Twitch, returns JSON, raises an error if it fails
async def _get(path, **params):
    token = await _get_token()
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(
            f"{BASE}{path}",
            params=params,
            headers={
                "Authorization": f"Bearer {token}",
                "Client-Id": os.getenv("GAMES_CLIENT_ID"),
            },
        )
        res.raise_for_status()
        return res.json()


# Turns Twitch's small thumbnail (or {width}x{height} template) into a bigger cover image
def _box_art(url, width=285, height=380):
    if not url:
        return None
    return (
        url.replace("{width}x{height}", f"{width}x{height}")
        .replace("52x72", f"{width}x{height}")
    )


# Returns a list of games that match the search
async def search_games(query: str):
    data = await _get("/search/categories", query=query, first=10)
    return [
        {
            "id": g["id"],
            "title": g["name"],
            "imageUrl": _box_art(g.get("box_art_url")),
            "source": "twitch",
        }
        for g in data["data"]
    ]


# Returns one game by its Twitch ID
async def get_game(game_id: str):
    data = await _get("/games", id=game_id)
    if not data["data"]:
        return None
    g = data["data"][0]
    return {
        "id": g["id"],
        "title": g["name"],
        "imageUrl": _box_art(g.get("box_art_url")),
        "igdbId": g.get("igdb_id"),
        "source": "twitch",
    }