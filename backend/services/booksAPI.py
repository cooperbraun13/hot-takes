import httpx

BASE = "https://openlibrary.org"
COVERS = "https://covers.openlibrary.org/b/id"
HEADERS = {"User-Agent": "HotTakes"}


# Builds a cover image URL, returns None if the book has no cover
def _cover(cover_id, size="M"):
    return f"{COVERS}/{cover_id}-{size}.jpg?default=false" if cover_id and cover_id > 0 else None


async def trending_books(limit=4):
    data = await _get("/trending/daily.json", limit=limit)
    return [
        {
            "id": book["key"].split("/")[-1],
            "title": book["title"],
            "year": book.get("first_publish_year"),
            "imageUrl": _cover(book.get("cover_i"), "L"),
            "source": "openlibrary",
        }
        for book in data["works"][:limit]
    ]


# Makes the API request, returns JSON, raises an error if the request fails
async def _get(path, **params):
    async with httpx.AsyncClient(timeout=10, headers=HEADERS) as client:
        res = await client.get(f"{BASE}{path}", params=params)
        res.raise_for_status()
        return res.json()


# Returns a list of books that match the search
async def search_books(query: str):
    data = await _get(
        "/search.json",
        q=query,
        limit=10,
        fields="key,title,author_name,first_publish_year,cover_i",
    )
    return [
        {
            "id": b["key"].split("/")[-1],  # "/works/OL45804W" -> "OL45804W"
            "title": b["title"],
            "subtitle": ", ".join(b.get("author_name", [])),
            "firstPublishYear": b.get("first_publish_year"),
            "imageUrl": _cover(b.get("cover_i")),
            "source": "openlibrary",
        }
        for b in data["docs"]
    ]


# Returns details for one book (an Open Library "work")
async def get_book(work_id: str):
    w = await _get(f"/works/{work_id}.json")

    # description can be a plain string or an object like {"type": ..., "value": ...}
    desc = w.get("description")
    if isinstance(desc, dict):
        desc = desc.get("value")

    # the covers list can contain -1 placeholders, so pick the first real one
    cover_id = next((c for c in w.get("covers", []) if c > 0), None)

    return {
        "id": work_id,
        "title": w["title"],
        "description": desc,
        "subjects": w.get("subjects", [])[:10],
        "firstPublishDate": w.get("first_publish_date"),
        "imageUrl": _cover(cover_id, "L"),
        "source": "openlibrary",
    }
