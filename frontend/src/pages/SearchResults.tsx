import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { BookOpen, Film, Gamepad2, Music, Tv } from "lucide-react";
import type { Media, MediaType } from "../types";

// Every category we search, in the order they appear on the page.
// `endpoint` is the backend route: /api/search/<endpoint>?q=...
const CATEGORIES = [
  { type: "movie", label: "Movies", endpoint: "movies", source: "tmdb", Icon: Film },
  { type: "tv", label: "TV", endpoint: "tv", source: "tmdb", Icon: Tv },
  { type: "book", label: "Books", endpoint: "books", source: "openlibrary", Icon: BookOpen },
  { type: "music", label: "Music", endpoint: "music", source: "spotify", Icon: Music },
  { type: "game", label: "Games", endpoint: "games", source: "twitch", Icon: Gamepad2 },
] as const;

const MAX_PER_CATEGORY = 8;

// Each search API names its fields a little differently
// (cover_url vs imageUrl, external_id vs id, ...). This turns any of them
// into the same Media shape the rest of the app uses.
type RawResult = Record<string, unknown>;
function toMedia(raw: RawResult, type: MediaType, fallbackSource: string): Media {
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  const source = str(raw.external_source) ?? str(raw.source) ?? fallbackSource;
  const externalId = String(raw.external_id ?? raw.id ?? "");
  const year = Number(raw.year ?? raw.firstPublishYear) || null;
  return {
    id: `${source}-${externalId}`,
    media_type: type,
    external_source: source,
    external_id: externalId,
    title: str(raw.title) ?? "Untitled",
    year,
    cover_url: str(raw.cover_url) ?? str(raw.cover_Url) ?? str(raw.imageUrl),
    description: str(raw.description) ?? str(raw.subtitle) ?? "",
  };
}

type Section = { status: "loading" | "done" | "error"; items: Media[] };

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const [results, setResults] = useState<{ query: string; sections: Record<string, Section> }>({
    query: "", sections: {},
  });

  useEffect(() => {
    if (query.length < 2) return;
    const controller = new AbortController();
    setResults({
      query,
      sections: Object.fromEntries(CATEGORIES.map((c) => [c.type, { status: "loading", items: [] }])),
    });

    // Search all categories at the same time; each fills in when it's ready.
    for (const { type, endpoint, source } of CATEGORIES) {
      fetch(`/api/search/${endpoint}?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error();
          return response.json() as Promise<RawResult[]>;
        })
        .then((data) => {
          const items = data.slice(0, MAX_PER_CATEGORY).map((raw) => toMedia(raw, type, source));
          setResults((r) => ({ ...r, sections: { ...r.sections, [type]: { status: "done", items } } }));
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setResults((r) => ({ ...r, sections: { ...r.sections, [type]: { status: "error", items: [] } } }));
        });
    }
    return () => controller.abort();
  }, [query]);

  if (query.length < 2) {
    return (
      <main>
        <div className="page-header">
          <h1>Search</h1>
          <p>Type at least two letters in the search bar above.</p>
        </div>
      </main>
    );
  }

  const sections = results.query === query ? results.sections : {};
  const allDone = CATEGORIES.every((c) => sections[c.type]?.status === "done" || sections[c.type]?.status === "error");
  const nothingFound = allDone && CATEGORIES.every((c) => !sections[c.type]?.items.length);

  return (
    <main className="search-page">
      <div className="page-header">
        <h1>Results for "{query}"</h1>
        <p>{nothingFound ? "Nothing matched. Try a different title." : "Pick something to see its details and rate it."}</p>
      </div>

      {CATEGORIES.map(({ type, label, Icon }) => {
        const section = sections[type];
        if (section?.status === "done" && !section.items.length) return null;
        return (
          <section className="media-section" key={type}>
            <h2>{label}</h2>
            {(!section || section.status === "loading") && <p className="search-status">Searching...</p>}
            {section?.status === "error" && <p className="search-status">Couldn't search {label.toLowerCase()} right now.</p>}
            {section?.status === "done" && (
              <div className="search-grid">
                {section.items.map((media) => (
                  <Link
                    key={media.id}
                    className="search-result"
                    // Same URL + state the home page cards use, so MediaDetails handles it.
                    to={`/media/${media.media_type}/${encodeURIComponent(media.external_source)}/${encodeURIComponent(media.external_id)}`}
                    state={{ media }}
                  >
                    {media.cover_url
                      ? <img src={media.cover_url} alt="" loading="lazy" />
                      : <div className="search-result-placeholder"><Icon size={32} aria-hidden="true" /></div>}
                    <strong>{media.title}</strong>
                    <span>{[media.year, type === "music" || type === "book" ? media.description : null].filter(Boolean).join(" · ")}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
