from datetime import date, datetime

from pydantic import AliasChoices, BaseModel, Field


# ---------- Cooper's original media schemas (used by /api/media routes) ----------

class MediaCreate(BaseModel):
  title: str
  type: str
  year: int | None = None
  description: str | None = None
  image_url: str | None = None

class MediaResponse(MediaCreate):
  id: int

  model_config = {"from_attributes": True}


# ---------- MVP schemas ----------
# "In" = JSON the frontend sends us. "Out" = JSON we send back.
# Out shapes match Sam's frontend/src/types/index.tsx.

# --- Users / auth ---

class UserCreate(BaseModel):
  """Body for register and login."""
  username: str
  password: str


class UserOut(BaseModel):
  """A user as the frontend sees it. Never includes the password hash."""
  id: int
  username: str
  created_at: datetime

  model_config = {"from_attributes": True}


# --- Media items ---

class MediaItemIn(BaseModel):
  """The movie info the frontend already has from search, sent along when logging a take.
  We save it to media_items the first time anyone logs that movie."""
  media_type: str = "movie"
  external_source: str = "tmdb"
  external_id: str
  title: str
  year: int | None = None
  cover_url: str | None = None


class MediaItemOut(BaseModel):
  """Matches Sam's `Media` type."""
  id: int
  media_type: str
  external_source: str
  external_id: str
  title: str
  # DB column is release_year / extra_metadata; the frontend calls them year / extra.
  year: int | None = Field(default=None, validation_alias=AliasChoices("year", "release_year"))
  cover_url: str | None = None
  description: str | None = None
  extra: dict | None = Field(default=None, validation_alias=AliasChoices("extra", "extra_metadata"))

  model_config = {"from_attributes": True}


# --- Takes ---

class TakeCreate(BaseModel):
  """Body for POST /takes."""
  media: MediaItemIn
  rating: float = Field(ge=0.5, le=5, multiple_of=0.5)   # 0.5, 1.0, 1.5 ... 5.0
  comment: str | None = Field(default=None, max_length=2000)
  watched_on: date | None = None


class TakeOut(BaseModel):
  """Matches Sam's `Take` type (plus comment and watched_on)."""
  id: int
  media: MediaItemOut = Field(validation_alias=AliasChoices("media", "media_item"))
  rating: float
  comment: str | None = None
  watched_on: date | None = None
  created_at: datetime

  model_config = {"from_attributes": True}
