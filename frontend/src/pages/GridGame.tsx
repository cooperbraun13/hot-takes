import { useEffect, useState, type SubmitEvent } from "react";
import { Search, X } from "lucide-react";
import { findMovieCandidates, firstValidMovie, parseMovieGuess, type SearchResult } from "./gridMatch";

interface Clue {
  id: string;
  label: string;
}

interface Grid {
  rows: Clue[];
  columns: Clue[];
}

interface Movie {
  id: string;
  title: string;
  year: string;
}

interface GuessResult {
  correct: boolean;
  movie: Movie;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

export default function GridGame() {
  const [grid, setGrid] = useState<Grid | null>(null);
  const [answers, setAnswers] = useState<Record<string, Movie>>({});
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [selected, setSelected] = useState<{
    row: Clue;
    column: Clue;
  } | null>(null);

  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<"grid" | "guess" | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    request<Grid>("/api/grid")
      .then((data) => {
        if (active) setGrid(data);
      })
      .catch(() => {
        if (active) setNotice("Could not load the grid.");
      });

    return () => {
      active = false;
    };
  }, []);

  const solvedCount = Object.keys(answers).length;
  const totalCells = grid ? grid.rows.length * grid.columns.length : 9;
  const won = !!grid && solvedCount === totalCells;
  const lost = wrongGuesses >= 2;
  const finished = won || lost;

  async function newGrid() {
    if (busy) return;

    setBusy("grid");
    setGrid(null);
    setAnswers({});
    setWrongGuesses(0);
    setSelected(null);
    setQuery("");
    setNotice("");

    try {
      setGrid(await request<Grid>("/api/grid"));
    } catch {
      setNotice("Could not load a new grid.");
    } finally {
      setBusy(null);
    }
  }

  function chooseCell(row: Clue, column: Clue) {
    setSelected({ row, column });
    setQuery("");
    setNotice("");
  }

  function closeSearch() {
    setSelected(null);
  }

  async function submitGuess(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || busy || finished) return;

    const typed = parseMovieGuess(query);
    if (typed.title.length < 2) {
      setNotice("Enter at least two letters to search.");
      return;
    }

    setBusy("guess");
    setNotice("");

    try {
      const movies = await request<SearchResult[]>(
        `/api/search/movies?q=${encodeURIComponent(typed.title)}`,
      );
      const matches = findMovieCandidates(typed, movies, selected.row.label, selected.column.label);
      if (!matches.preferred.length && !matches.other.length) {
        setNotice("I couldn't find that movie. Try another title. No guess used.");
        return;
      }

      const used = new Set(Object.values(answers).map((answer) => answer.id));
      const preferred = matches.preferred.filter((movie) => !used.has(movie.external_id));
      if (matches.preferred.length && !preferred.length) {
        setNotice("Matching movies are already on the grid. No guess used.");
        return;
      }

      const candidates = preferred.length
        ? preferred
        : matches.other.filter((movie) => !used.has(movie.external_id)).slice(0, 1);
      if (!candidates.length) {
        setNotice("That movie is already on the grid. No guess used.");
        return;
      }
      const correct = await firstValidMovie(candidates, (movie) =>
        request<GuessResult>("/api/grid/guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movie_id: movie.external_id,
            row_id: selected.row.id,
            column_id: selected.column.id,
          }),
        }),
      );
      if (correct) {
        const key = `${selected.row.id}:${selected.column.id}`;
        setAnswers((current) => ({ ...current, [key]: correct.movie }));
        setNotice(`${correct.movie.title} is correct!`);
        closeSearch();
        return;
      }

      setWrongGuesses((count) => count + 1);
      setNotice(`${typed.title} does not match both clues.`);
      setQuery("");
    } catch {
      setNotice("Could not check that movie. No guess was used.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="grid-page">
      <div className="page-header grid-heading">
        <div>
          <h1>Grid Game</h1>
          <p>
            Find a movie matching both clues. Use each movie once. You can make
            one wrong guess.
          </p>
        </div>

        <button
          className="grid-action"
          type="button"
          onClick={newGrid}
          disabled={busy !== null || (!grid && !notice)}
        >
          New Grid
        </button>
      </div>

      <div className="grid-stats">
        <span>
          {solvedCount} / {totalCells} correct
        </span>
        <span>Wrong guesses left: {Math.max(0, 1 - wrongGuesses)}</span>
      </div>

      {selected && !finished && (
        <section
          className="grid-popover"
          role="dialog"
          aria-label={`Choose a movie for ${selected.row.label} and ${selected.column.label}`}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !busy) closeSearch();
          }}
        >
          <div className="grid-popover-heading">
            <span>
              {selected.row.label} + {selected.column.label}
            </span>

            <button
              type="button"
              onClick={closeSearch}
              disabled={busy !== null}
              aria-label="Close search"
            >
              <X size={16} />
            </button>
          </div>

          <form className="grid-search" onSubmit={submitGuess}>
            <button
              type="submit"
              disabled={busy !== null}
              aria-label="Submit movie guess"
            >
              <Search size={20} />
            </button>

            <input
              autoFocus
              required
              minLength={2}
              aria-label="Movie title"
              placeholder="Guess a movie title"
              value={query}
              disabled={busy !== null}
              onChange={(event) => {
                setQuery(event.target.value);
                setNotice("");
              }}
            />
          </form>

          {busy === "guess" && <p className="grid-search-feedback" role="status">Finding movie...</p>}
          {notice && <p className="grid-search-feedback" role="status">{notice}</p>}
        </section>
      )}

      {notice && !grid && (
        <p className="grid-notice" role="status">
          {notice}
        </p>
      )}

      {!grid && !notice && <p className="grid-notice">Loading grid...</p>}

      {won && <p className="grid-notice">You completed the grid!</p>}

      {lost && <p className="grid-notice">Game over. Your second wrong guess ended the round.</p>}

      {grid && (
        <div className="grid-scroll">
          <table className="grid-board">
            <thead>
              <tr>
                <th scope="col">Movie</th>
                {grid.columns.map((column) => (
                  <th scope="col" key={column.id}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {grid.rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.label}</th>

                  {grid.columns.map((column) => {
                    const key = `${row.id}:${column.id}`;
                    const answer = answers[key];
                    const isSelected =
                      selected?.row.id === row.id &&
                      selected?.column.id === column.id;

                    return (
                      <td key={column.id}>
                        <button
                          type="button"
                          className={`grid-cell${
                            answer ? " grid-cell-solved" : ""
                          }${isSelected ? " grid-cell-selected" : ""}`}
                          onClick={() => chooseCell(row, column)}
                          disabled={!!answer || finished || busy !== null}
                          aria-pressed={isSelected}
                          aria-label={`${row.label} and ${column.label}: ${
                            answer
                              ? `${answer.title}, correct`
                              : "choose a movie"
                          }`}
                        >
                          {answer && (
                            <>
                              <strong>{answer.title}</strong>
                              <small>{answer.year}</small>
                            </>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="grid-attribution">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </main>
  );
}
