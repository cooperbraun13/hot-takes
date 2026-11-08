# HotTakes — Project Context

> Single source of truth for anyone (or any AI assistant) working on this repo.
> Update this file whenever a decision changes. If code and this file disagree, fix one of them.

## What HotTakes is

A web app for logging and sharing opinions ("takes") on any media you consume — Letterboxd, but not limited to movies.
Target user: anybody who wants to log and share their opinions. Differentiator: one place for every kind of media.

## Team

| Person | Role | Owns |
| --- | --- | --- |
| Christian Carrington | Backend | API, database, migrations |
| Cooper Braun | Integrations | External media APIs (TMDB first) |
| Sam Vanturennout | Frontend | React app, UI |
| Ayden Humphries | Project lead | Board, planning, deployment |

## Current scope (MVP — tonight)

Media type: **movies only**, via TMDB.

1. Sign up, log in, log out
2. Search for a movie and open its movie page
3. Log a movie from its movie page with a score (0.5–5, half-star steps) and a comment
4. "My movies" page listing what you've logged — the landing page after login
5. A 3×3 movie Grid Game with actors, directors, genres, release periods, and title-letter ranges randomized across both rows and columns. A curated film list is used to choose boards with nine distinct candidate answers; title guesses are checked with TMDB. The player does not need to specify a year: matching versions are checked against the cell, and one submitted title uses at most one wrong guess. Refreshing or starting a new grid resets the round.

**Not in the MVP:** follows and friend feed, full profile page, other media types, stored game scores/history, deployment.
Do not build these until the MVP works end to end.

## Decisions

| Area | Decision | Status |
| --- | --- | --- |
| Backend | Python + FastAPI | Decided |
| Database | SQLite (dev and deployed) | Decided |
| ORM / migrations | SQLAlchemy + Alembic | Proposed |
| Auth | Simple custom login: users table, password, limit failed attempts. Store password **hashes** (bcrypt), never plain text | Decided (hashing proposed) |
| Frontend | React + TypeScript (Vite) | Decided (Vite proposed) |
| Styling | Plain CSS | Decided |
| Look and feel | Bold and playful; top nav bar | Decided |
| Social model | One-way follows (post-MVP) | Decided |
| Scores | 0.5–5 in half-star steps | Decided |
| Hosting | Tentative: run from a laptop with a tunnel (ngrok / Cloudflare Tunnel); finalize after core features work | Deferred |

## Repo structure

```
hottakes/
├── PROJECT_CONTEXT.md        # this file
├── README.md                 # how to run locally
├── .gitignore                # include .env, *.db, node_modules, __pycache__
├── .env.example              # every env var, no real values
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py           # FastAPI app, router registration, CORS
│   │   ├── config.py         # reads env vars (API keys, DB path)
│   │   ├── database.py       # SQLAlchemy engine + session
│   │   ├── models.py         # SQLAlchemy tables
│   │   ├── schemas.py        # Pydantic request/response shapes
│   │   ├── auth.py           # password hashing, login, attempt limits
│   │   ├── routers/
│   │   │   ├── auth.py       # /auth/signup, /auth/login, /auth/logout
│   │   │   ├── media.py      # /media/search, /media/{id}
│   │   │   └── takes.py      # /takes (create), /me/takes (list)
│   │   └── integrations/
│   │       ├── base.py       # common adapter interface
│   │       ├── tmdb.py       # movies + TV (MVP)
│   │       ├── music.py      # music + podcasts (later)
│   │       └── games.py      # video games (later)
│   └── tests/
└── frontend/
    ├── package.json
    └── src/
        ├── api/              # functions that call the backend
        ├── pages/            # Login, Signup, Search, MoviePage, MyMovies
        ├── components/       # NavBar, StarRating, MovieCard, TakeForm
        ├── types/            # shared TypeScript types
        └── styles/           # plain CSS files
```

## Integrations: the adapter pattern

Every external API gets one adapter in `backend/app/integrations/`. Each adapter exposes the same two functions and
returns the same shape, so the rest of the app never knows which API it is talking to:

```python
def search(query: str) -> list[MediaResult]: ...
def get_details(external_id: str) -> MediaResult: ...
```

`MediaResult` fields: `media_type`, `external_source`, `external_id`, `title`, `year`, `cover_url`, `description`, `extra` (dict).

When a user logs an item, save it to `media_items` (if not already there) so we don't refetch it from the API every time.

| Media type | API | Adapter | Status |
| --- | --- | --- | --- |
| Movies, TV | TMDB | `tmdb.py` | MVP (movies only) |
| Music, podcasts | Spotify | `music.py` | Key obtained, later |
| Video games | IGDB | `games.py` | Key obtained, later |

TMDB terms require visible attribution (e.g. in the footer): "This product uses the TMDB API but is not endorsed or certified by TMDB."

## Data model (MVP tables)

| Table | Fields |
| --- | --- |
| users | id (PK), username (unique), password_hash, failed_login_attempts, created_at |
| media_items | id (PK), media_type, external_source, external_id, title, cover_url, release_year, extra_metadata (JSON) — unique on (external_source, external_id) |
| takes | id (PK), user_id → users, media_item_id → media_items, rating (0.5–5), comment, watched_on, created_at |

Post-MVP: `follows`, `catalogs`, `catalog_items`, game scores/history (undefined).

## Environment variables

```
DATABASE_URL=sqlite:///./hottakes.db
MOVIES_TV=
MUSIC_API_KEY=
GAMES_API_KEY=
```

Real values go in `.env` (git-ignored). Never commit keys or the `.db` file.

## Conventions

- Feature branches off `main`; no direct pushes; one review before merge.
- Backend runs on `localhost:8000`, frontend dev server on `localhost:5173`.
- FastAPI's auto docs at `/docs` are the API contract — check there before asking.
- Keep media-type-specific logic inside `integrations/`; everything else stays generic.

## Status

- [ ] Repo + skeleton (backend health check, frontend calls it)
- [ ] Auth
- [ ] Movie search + movie page
- [ ] Log a take
- [ ] My movies page
- [ ] Deployment (deferred)

## Open questions

- Which music/podcast and game APIs did we get? Fill in the integrations table.
- What is the game scores/history feature? (deferred)
- Are takes public, friends-only, or per take? (post-MVP)
