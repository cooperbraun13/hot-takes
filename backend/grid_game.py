"""
Static clue pool and TMDB-backed validation for the movie grid.
"""

import random

ACTORS = [
  {"id": "actor-rdj", "label": "Robert Downey Jr.", "kind": "actor", "value": "Robert Downey Jr."},
  {"id": "actor-hanks", "label": "Tom Hanks", "kind": "actor", "value": "Tom Hanks"},
  {"id": "actor-dicaprio", "label": "Leonardo DiCaprio", "kind": "actor", "value": "Leonardo DiCaprio"},
  {"id": "actor-johansson", "label": "Scarlett Johansson", "kind": "actor", "value": "Scarlett Johansson"},
  {"id": "actor-pitt", "label": "Brad Pitt", "kind": "actor", "value": "Brad Pitt"},
  {"id": "actor-washington", "label": "Denzel Washington", "kind": "actor", "value": "Denzel Washington"},
]

GENRES = [
  {"id": "genre-action", "label": "Action", "kind": "genre", "value": 28},
  {"id": "genre-comedy", "label": "Comedy", "kind": "genre", "value": 35},
  {"id": "genre-drama", "label": "Drama", "kind": "genre", "value": 18},
  {"id": "genre-scifi", "label": "Science Fiction", "kind": "genre", "value": 878},
  {"id": "genre-thriller", "label": "Thriller", "kind": "genre", "value": 53},
]

YEARS = [
  {"id": "years-1990-2000", "label": "1990-2000", "kind": "years", "value": [1990, 2000]},
  {"id": "years-2001-2010", "label": "2001-2010", "kind": "years", "value": [2001, 2010]},
  {"id": "years-2011-2020", "label": "2011-2020", "kind": "years", "value": [2011, 2020]},
  {"id": "years-2021-2026", "label": "2021-2026", "kind": "years", "value": [2021, 2026]},
]

CLUES = {clue["id"]: clue for clue in ACTORS + GENRES + YEARS}

def new_grid():
  """
  Choose three compatible row clues and three release-year columns.
  """
  rows = random.sample(random.choice((ACTORS, GENRES)), 3)
  columns = random.sample(YEARS, 3)
  return {
    "rows": [{"id": clue["id"], "label": clue["label"]} for clue in rows],
    "columns": [{"id": clue["id"], "label": clue["label"]} for clue in columns],
  }

def matches_clue(movie, clue):
  if clue["kind"] == "actor":
    return clue["value"].casefold() in movie["cast_names"]
  if clue["kind"] == "genre":
    return clue["value"] in movie["genre_ids"]
  if clue["kind"] == "years":
    release_date = movie["release_date"]
    year = int(release_date[:4]) if len(release_date) >= 4 and release_date[:4].isdigit() else None
    return year is not None and clue["value"][0] <= year <= clue["value"][1]
  return False
