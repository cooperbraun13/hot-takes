-- Run against backend/media.db. Safe to run again; existing books are preserved.
BEGIN;
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    year INTEGER,
    description TEXT,
    cover_url TEXT
);

INSERT INTO books (id, title, author, year, description, cover_url)
VALUES
    ('1984', '1984', 'George Orwell', 1949,
     'A dystopian novel about surveillance, propaganda, and totalitarian power.', NULL),
    ('animal-farm', 'Animal Farm', 'George Orwell', 1945,
     'A political fable about a revolution on a farm.', NULL),
    ('pride-and-prejudice', 'Pride and Prejudice', 'Jane Austen', 1813,
     'A novel about love, social class, and first impressions.', NULL),
    ('the-hobbit', 'The Hobbit', 'J. R. R. Tolkien', 1937,
     'Bilbo Baggins joins a company of dwarves on a quest to reclaim their home.', NULL),
    ('the-great-gatsby', 'The Great Gatsby', 'F. Scott Fitzgerald', 1925,
     'A story of wealth, longing, and the American dream in the Jazz Age.', NULL)
ON CONFLICT(id) DO NOTHING;
COMMIT;

-- After placing your image at frontend/public/images/1984.jpg, run:
-- UPDATE books SET cover_url = '/images/1984.jpg' WHERE id = '1984';
