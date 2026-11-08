"""
Static clue pool and TMDB-backed validation for the movie grid.
"""

import random
from functools import lru_cache

from grid_seeds import (
  BALE, CAMERON, DENZEL, GERWIG, HANKS, LEO, NOLAN, PITT,
  RDJ, SCARLETT, SCORSESE, SEED_MOVIES, VILLENEUVE, ZEMECKIS,
)

ACTORS = [
  {"id": "actor-rdj", "label": RDJ, "kind": "actor", "value": RDJ},
  {"id": "actor-hanks", "label": HANKS, "kind": "actor", "value": HANKS},
  {"id": "actor-dicaprio", "label": LEO, "kind": "actor", "value": LEO},
  {"id": "actor-johansson", "label": SCARLETT, "kind": "actor", "value": SCARLETT},
  {"id": "actor-bale", "label": BALE, "kind": "actor", "value": BALE},
  {"id": "actor-pitt", "label": PITT, "kind": "actor", "value": PITT},
  {"id": "actor-washington", "label": DENZEL, "kind": "actor", "value": DENZEL},
]

DIRECTORS = [
  {"id": "director-nolan", "label": NOLAN, "kind": "director", "value": NOLAN},
  {"id": "director-scorsese", "label": SCORSESE, "kind": "director", "value": SCORSESE},
  {"id": "director-cameron", "label": CAMERON, "kind": "director", "value": CAMERON},
  {"id": "director-zemeckis", "label": ZEMECKIS, "kind": "director", "value": ZEMECKIS},
  {"id": "director-villeneuve", "label": VILLENEUVE, "kind": "director", "value": VILLENEUVE},
  {"id": "director-gerwig", "label": GERWIG, "kind": "director", "value": GERWIG},
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

INITIALS = [
  {"id": "initial-a-h", "label": "A-H", "kind": "initial", "value": ["A", "H"]},
  {"id": "initial-i-p", "label": "I-P", "kind": "initial", "value": ["I", "P"]},
  {"id": "initial-q-z", "label": "Q-Z", "kind": "initial", "value": ["Q", "Z"]},
]

CLUE_GROUPS = [ACTORS, DIRECTORS, GENRES, YEARS, INITIALS]
ALL_CLUES = [clue for group in CLUE_GROUPS for clue in group]
CLUES = {clue["id"]: clue for clue in ALL_CLUES}

def matches_clue(movie, clue):
  if clue["kind"] == "actor":
    return clue["value"].casefold() in movie["cast_names"]
  if clue["kind"] == "director":
    return clue["value"].casefold() in movie["director_names"]
  if clue["kind"] == "genre":
    return clue["value"] in movie["genre_ids"]
  if clue["kind"] == "years":
    release_date = movie["release_date"]
    year = int(release_date[:4]) if len(release_date) >= 4 and release_date[:4].isdigit() else None
    return year is not None and clue["value"][0] <= year <= clue["value"][1]
  if clue["kind"] == "initial":
    first = movie["title"].strip()[:1].upper()
    return bool(first) and clue["value"][0] <= first <= clue["value"][1]
  return False

SEED_FACTS = [
  {
    "title": title,
    "release_date": f"{year}-01-01",
    "cast_names": {name.casefold() for name in cast},
    "director_names": {name.casefold() for name in directors},
    "genre_ids": set(genres),
  }
  for title, year, cast, directors, genres in SEED_MOVIES
]

@lru_cache(maxsize=None)
def _pair_options(first_id, second_id):
  first, second = CLUES[first_id], CLUES[second_id]
  return tuple(
    index for index, movie in enumerate(SEED_FACTS)
    if matches_clue(movie, first) and matches_clue(movie, second)
  )

def _has_distinct_answers(rows, columns):
  cells = [_pair_options(row["id"], column["id"]) for row in rows for column in columns]
  if any(not options for options in cells):
    return False

  assigned = {}

  def assign(cell, seen):
    for movie in cells[cell]:
      if movie in seen:
        continue
      seen.add(movie)
      if movie not in assigned or assign(assigned[movie], seen):
        assigned[movie] = cell
        return True
    return False

  return all(assign(cell, set()) for cell in range(9))

def new_grid():
  """
  Choose varied clues with nine distinct known answers across the board.
  """
  for _ in range(500):
    rows = [random.choice(group) for group in random.sample(CLUE_GROUPS, 3)]
    row_ids = {clue["id"] for clue in rows}
    compatible = [
      clue for clue in ALL_CLUES
      if clue["id"] not in row_ids and all(_pair_options(row["id"], clue["id"]) for row in rows)
    ]
    column_groups = [
      [clue for clue in compatible if clue["kind"] == group[0]["kind"]]
      for group in CLUE_GROUPS
    ]
    column_groups = [group for group in column_groups if group]
    if len(column_groups) < 3:
      continue
    for _ in range(8):
      columns = [random.choice(group) for group in random.sample(column_groups, 3)]
      if _has_distinct_answers(rows, columns):
        return _public_grid(rows, columns)

  rows = [CLUES[id] for id in ("genre-action", "years-2011-2020", "initial-a-h")]
  columns = [CLUES[id] for id in ("actor-rdj", "director-nolan", "genre-drama")]
  return _public_grid(rows, columns)


def _public_grid(rows, columns):
  return {
    "rows": [{"id": clue["id"], "label": clue["label"]} for clue in rows],
    "columns": [{"id": clue["id"], "label": clue["label"]} for clue in columns],
  }
