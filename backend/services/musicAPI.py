import os
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

TOKEN_URL = "https://accounts.spotify.com/api/token"
BASE = "https://api.spotify.com/v1"

# Cached token so we don't request a new one on every search
_token = None
_expires_at = 0


# Gets an access token (client credentials), reuses it until about a minute before it expires
async def _get_token():
    global _token, _expires_at

    if _token and time.time() < _expires_at - 60:
        return _token

    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.post(
            TOKEN_URL,
            auth=(os.getenv("SPOTIFY_CLIENT_ID"), os.getenv("MUSIC_POD")),
            data={"grant_type": "client_credentials"},
        )
        res.raise_for_status()
        data = res.json()

    _token = data["access_token"]
    _expires_at = time.time() + data["expires_in"]
    return _token


# Makes an authenticated request to Spotify, returns JSON, raises an error if it fails
async def _get(path, **params):
    token = await _get_token()
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(
            f"{BASE}{path}",
            params=params,
            headers={"Authorization": f"Bearer {token}"},
        )
        res.raise_for_status()
        return res.json()


# Returns a list of tracks that match the search
async def search_tracks(query: str):
    data = await _get("/search", q=query, type="track", limit=10)
    return [
        {
            "id": t["id"],
            "title": t["name"],
            "subtitle": ", ".join(a["name"] for a in t["artists"]),
            "album": t["album"]["name"],
            "imageUrl": t["album"]["images"][0]["url"] if t["album"]["images"] else None,
            "previewUrl": t.get("preview_url"),
            "spotifyUrl": t["external_urls"]["spotify"],
            "source": "spotify",
        }
        for t in data["tracks"]["items"]
    ]


# Returns full details for one track
async def get_track(track_id: str):
    t = await _get(f"/tracks/{track_id}")
    return {
        "id": t["id"],
        "title": t["name"],
        "artists": [a["name"] for a in t["artists"]],
        "album": t["album"]["name"],
        "releaseDate": t["album"]["release_date"],
        "durationMs": t["duration_ms"],
        "imageUrl": t["album"]["images"][0]["url"] if t["album"]["images"] else None,
        "previewUrl": t.get("preview_url"),
        "spotifyUrl": t["external_urls"]["spotify"],
        "source": "spotify",
    }