from pydantic import BaseModel

class MediaCreate(BaseModel):
  title: str
  type: str
  year: int | None = None
  description: str | None = None
  image_url: str | None = None

class MediaResponse(MediaCreate):
  id: int

  model_config = {"from_attributes": True}


class GridGuess(BaseModel):
  movie_id: str
  row_id: str
  column_id: str
