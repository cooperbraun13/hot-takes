"""Small live discovery lists using the existing authenticated API clients."""
from datetime import datetime, timezone
from services import moviesAPI, gamesAPI, musicAPI, booksAPI


def media_item(kind, source, external_id, title, cover_url=None, year=None, description=""):
    return {
        "id": f"{kind}-{external_id}", "media_type": kind,
        "external_source": source, "external_id": str(external_id),
        "title": title, "cover_url": cover_url, "year": year,
        "description": description or "", "extra": {"discovery": True},
    }


async def discover(kind, limit):
    if kind == "book":
        books = await booksAPI.trending_books(limit)
        return [media_item(kind, "openlibrary", b["id"], b["title"], b["imageUrl"], b["year"])
                for b in books]
    if kind in ("movie", "tv"):
        data = await moviesAPI._get(f"{kind}/popular")
        return [media_item(
            kind, "tmdb", item["id"], item.get("title") or item.get("name"),
            f"https://image.tmdb.org/t/p/w500{item['poster_path']}" if item.get("poster_path") else None,
            int(date[:4]) if (date := item.get("release_date") or item.get("first_air_date")) else None,
            item.get("overview"),
        ) for item in data["results"][:limit]]
    if kind == "game":
        data = await gamesAPI._get("/games/top", first=100)
        return [media_item(
            kind, "twitch", item["id"], item["name"],
            gamesAPI._box_art(item.get("box_art_url")),
        ) for item in data["data"] if item.get("igdb_id")][:limit]
    if kind == "music":
        year = datetime.now(timezone.utc).year
        tracks = await musicAPI.search_tracks(f"genre:pop year:{year - 1}-{year}")
        return [media_item(kind, "spotify", item["id"], item["title"], item["imageUrl"])
                for item in tracks[:limit]]
    raise ValueError("Unsupported discovery type")
