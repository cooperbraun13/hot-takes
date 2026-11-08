import { useEffect, useState } from "react";
import type { MediaType } from "../types";

export interface MediaSelection {
  media_type: MediaType;
  external_source: string;
  external_id: string;
  title: string;
  year: number | null;
  cover_url: string | null;
}

interface SearchResult {
  id?: string | number;
  external_id?: string;
  title: string;
  year?: string | number | null;
  cover_url?: string | null;
  cover_Url?: string | null;
  imageUrl?: string | null;
  subtitle?: string;
}

const endpoints: Partial<Record<MediaType, string>> = {
  movie: "movies", tv: "tv", music: "music", game: "games", book: "books",
};

const sources: Partial<Record<MediaType, string>> = {
  movie: "tmdb", tv: "tmdb", music: "spotify", game: "twitch", book: "local",
};

export default function MediaSearch({ category, value, onChange }: {
  category: MediaType;
  value: MediaSelection | null;
  onChange: (value: MediaSelection | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{
    query: string; items: SearchResult[]; error: string;
  } | null>(null);
  const searchQuery = query.trim();

  useEffect(() => {
    if (searchQuery.length < 2 || value) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search/${endpoints[category]}?q=${encodeURIComponent(searchQuery)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Search failed. Please try another title or try again.");
        const items: SearchResult[] = await response.json();
        if (!controller.signal.aborted) setResult({ query: searchQuery, items, error: "" });
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ query: searchQuery, items: [], error: error instanceof Error ? error.message : "Search failed." });
        }
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [category, searchQuery, value]);

  const current = result?.query === searchQuery ? result : null;
  const searching = searchQuery.length >= 2 && !value && !current;

  return (
    <div className="media-search">
      <label htmlFor="media-title">Search by title</label>
      <input
        id="media-title" value={query} autoComplete="off"
        placeholder="Type at least 2 characters"
        aria-describedby="media-search-status"
        onChange={(event) => {
          setQuery(event.target.value);
          setResult(null);
          onChange(null);
        }}
      />
      <p id="media-search-status" role="status">
        {value ? `Selected: ${value.title}` : searching ? "Searching..." : "Choose a matching result to fill in the media ID."}
      </p>
      {!value && current?.error && <p role="alert">{current.error}</p>}
      {!value && current && !current.error && current.items.length === 0 && (
        <p>No matches found. Try another title.</p>
      )}
      {!value && Boolean(current?.items.length) && (
        <ul className="media-search-results" aria-label="Matching titles">
          {current?.items.map((item) => (
            <li key={item.external_id ?? item.id}>
              <button type="button" onClick={() => {
                const year = item.year ? Number(item.year) : null;
                onChange({
                  media_type: category,
                  external_source: sources[category]!,
                  external_id: String(item.external_id ?? item.id),
                  title: item.title,
                  year: year && Number.isFinite(year) ? year : null,
                  cover_url: item.cover_url ?? item.cover_Url ?? item.imageUrl ?? null,
                });
                setQuery(item.title);
              }}>
                <strong>{item.title}</strong>
                {item.year && <span> ({item.year})</span>}
                {item.subtitle && <span> — {item.subtitle}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <label htmlFor="media-id">Media ID</label>
      <input id="media-id" value={value?.external_id ?? ""} readOnly placeholder="Filled when you select a title" />
    </div>
  );
}
