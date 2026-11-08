From the `backend` directory, populate the books table in the existing SQLite database:

```bash
sqlite3 media.db < sql/seed_books.sql
```

The seed preserves existing rows and cover images when run again.
Start the backend as usual; `/api/books/1984` returns the saved book.

To add the cover, save your image as `frontend/public/images/1984.jpg`, then run from `backend`:

```bash
sqlite3 media.db "UPDATE books SET cover_url = '/images/1984.jpg' WHERE id = '1984';"
```

Refresh the frontend to load the image. Until then, the card uses the book icon.
