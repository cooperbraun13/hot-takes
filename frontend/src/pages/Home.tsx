import { useEffect, useState } from "react";
import MediaCard from "../components/MediaCard";
import type { Media, MediaType } from "../types";

const categoryLabels: Record<MediaType, string> = {
  movie: "Movies", tv: "TV Shows", music: "Music",
  game: "Games", book: "Books", podcast: "Podcasts",
};

export default function Home({ mediaType }: { mediaType?: MediaType }) {
  const requestKey = mediaType ?? "home";
  const [result, setResult] = useState<{
    key: string; items: Media[]; errors: string[];
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const types: MediaType[] = mediaType ? [mediaType] : ["movie", "tv", "music", "book", "game"];
    async function loadMedia() {
      const responses = await Promise.allSettled(types.map(async (type) => {
        const response = await fetch(`/api/discover/${type}?limit=4`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Could not load ${categoryLabels[type].toLowerCase()}.`);
        return await response.json() as Media[];
      }));
      if (controller.signal.aborted) return;
      const items: Media[] = [];
      const errors: string[] = [];
      responses.forEach((response, index) => {
        if (response.status === "fulfilled") items.push(...response.value);
        else errors.push(`Could not load ${categoryLabels[types[index]].toLowerCase()}. Please try refreshing.`);
      });
      setResult({ key: requestKey, items, errors });
    }
    void loadMedia();
    return () => controller.abort();
  }, [mediaType, requestKey]);

  const current = result?.key === requestKey ? result : null;
  const loading = !current;
  const items = current?.items ?? [];
  const category = mediaType ? categoryLabels[mediaType] : null;
  const visibleMedia = mediaType ? items : ["movie", "tv", "music", "book"].flatMap(
    (type) => items.filter((item) => item.media_type === type).slice(0, 1),
  );

  return (
    <main>
      <div className="page-header">
        <h1>{category ? `Discover ${category}.` : "Discover what's trending."}</h1>
        <p>{category ? `Explore ${category.toLowerCase()} and find your next favorite.` : "Movies, shows, books, music, games, and more."}</p>
      </div>

      <section className="media-section" aria-busy={loading}>
        <h2>{category ? `Discover ${category}` : "Trending This Week"}</h2>
        {loading && <p role="status">Loading media…</p>}
        {current?.errors.map((error) => <p role="alert" key={error}>{error}</p>)}
        <div className="media-grid">
          {visibleMedia.map((item) => <MediaCard key={item.id} media={item} />)}
        </div>
        {!loading && !current?.errors.length && visibleMedia.length === 0 && (
          <p>No {category?.toLowerCase() ?? "media"} available yet.</p>
        )}
      </section>

      <section className="media-banner">
        <h2>Got a Hot Take?</h2>
        <p>Rate what you love. Review what you hate.</p>
      </section>

      {!mediaType && (
        <section className="media-section">
          <h2>Popular in Games</h2>
          <div className="media-grid">
            {items.filter((item) => item.media_type === "game").map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
