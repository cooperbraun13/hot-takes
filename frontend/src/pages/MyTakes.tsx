
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";

import MediaCard from "../components/MediaCard";
import type {
  MediaCategory,
  MediaType,
  Take,
} from "../types";

import "../styles/globals.css";

interface SavedTake {
  id: number;
  media: Omit<Take["media"], "id" | "description" | "extra"> & {
    id: number;
    description: string | null;
    extra: Record<string, unknown> | null;
  };
  rating: number;
  comment: string | null;
  watched_on: string | null;
  created_at: string;
}

async function responseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  return typeof body?.detail === "string"
    ? body.detail
    : `Request failed (${response.status}).`;
}

// Keep the existing card types while adapting the database response.
function toTake(saved: SavedTake): Take {
  return {
    ...saved,
    id: String(saved.id),
    comment: saved.comment ?? "",
    media: {
      ...saved.media,
      id: String(saved.media.id),
      description: saved.media.description ?? "",
      extra: saved.media.extra ?? undefined,
    },
  };
}

const categories: MediaCategory[] = [
  {
    id: "movie",
    name: "Movies",
    icon: "🎬",
    path: "/search?type=movie",
    available: true,
  },
  {
    id: "music",
    name: "Music",
    icon: "🎵",
    path: "/search?type=music",
    available: true,
  },
  {
    id: "tv",
    name: "TV Shows",
    icon: "📺",
    path: "/search?type=tv",
    available: true,
  },
  {
    id: "game",
    name: "Games",
    icon: "🎮",
    path: "/search?type=game",
    available: true,
  },
  {
    id: "podcast",
    name: "Podcasts",
    icon: "🎙️",
    path: "/search?type=podcast",
    available: true,
  },
];


function MyTakes() {
  const [takes, setTakes] = useState<Take[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [title, setTitle] = useState("");
  const [externalId, setExternalId] = useState("");
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadTakes() {
      try {
        const response = await fetch("/api/me/takes", {
          credentials: "include",
          signal: controller.signal,
        });
        if (response.status === 401) {
          setNeedsLogin(true);
          return;
        }
        if (!response.ok) throw new Error(await responseError(response));
        const data: SavedTake[] = await response.json();
        if (!controller.signal.aborted) setTakes(data.map(toTake));
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Could not load your takes.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadTakes();
    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaveError("");
    if (!title.trim() || !externalId.trim()) {
      setSaveError("Enter a movie title and TMDB movie ID.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/takes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media: {
            media_type: "movie", external_source: "tmdb",
            external_id: externalId.trim(), title: title.trim(),
            year: null, cover_url: null,
          },
          rating, comment: comment.trim() || null, watched_on: null,
        }),
      });
      if (response.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!response.ok) throw new Error(await responseError(response));
      const saved: SavedTake = await response.json();
      setTakes((current) => [toTake(saved), ...current]);
      setSelectedType("all");
      setTitle("");
      setExternalId("");
      setRating(3);
      setComment("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save your take.");
    } finally {
      setSaving(false);
    }
  }

  const [selectedType, setSelectedType] =
    useState<MediaType | "all">("all");

  const filteredTakes = takes.filter((take) => {
    return (
      selectedType === "all" ||
      take.media.media_type === selectedType
    );
  });

  if (loading) return <main><p role="status">Loading your takes...</p></main>;
  if (needsLogin) return <main><p><Link to="/login">Log in</Link> to view and save your takes.</p></main>;

  return (
    <main className="my-takes-page">
      <div className="page-header">
        <h1>My Takes</h1>
        <p>Your ratings for movies, shows, music, games, and more.</p>
      </div>

      <section className="media-section">
        <h2>Rate a movie</h2>
        <form className="take-form" onSubmit={handleSubmit}>
          <fieldset disabled={saving || Boolean(error)}>
            <legend>New take</legend>
            <label htmlFor="movie-title">Movie title</label>
            <input id="movie-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <label htmlFor="movie-id">TMDB movie ID</label>
            <input id="movie-id" value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder="27205 for Inception" required />
            <label htmlFor="rating">Rating</label>
            <select id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {Array.from({ length: 10 }, (_, i) => (i + 1) / 2).map((value) => (
                <option key={value} value={value}>{value} / 5</option>
              ))}
            </select>
            <label htmlFor="comment">Your take (optional)</label>
            <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />
            <button type="submit">{saving ? "Saving..." : "Save take"}</button>
          </fieldset>
          {saveError && <p role="alert">{saveError}</p>}
        </form>
      </section>

      <section className="media-section takes-section">
        <h2>Your Ratings</h2>
        {error && <p role="alert">{error} Refresh to try again.</p>}

        <div className="filter-row">
          <button
            className={selectedType === "all" ? "active" : ""}
            aria-pressed={selectedType === "all"}
            onClick={() => setSelectedType("all")}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              aria-pressed={selectedType === category.id}
              className={
                selectedType === category.id ? "active" : ""
              }
              onClick={() => setSelectedType(category.id as MediaType)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="media-grid">
          {filteredTakes.map((take) => (
            <article key={take.id}>
            <MediaCard
              key={take.id}
              media={take.media}
              rating={take.rating}
            />
            {take.comment && <p>{take.comment}</p>}
            </article>
          ))}
        </div>

        {!error && filteredTakes.length === 0 && (
          <p className="takes-empty" role="status">You haven't logged any takes in this category.</p>
        )}
      </section>

    </main>
  );
}

export default MyTakes;
