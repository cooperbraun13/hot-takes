import MediaCard from "../components/MediaCard";
import type { Media } from "../types";

const media: Media[] = [
  {
    id: "1",
    external_source: "tmdb",
    external_id: "157336",
    title: "Interstellar",
    media_type: "movie",
    year: 2014,
    cover_url: null,
    description: "A science fiction movie.",
  },
  {
    id: "2",
    external_source: "igdb",
    external_id: "example-minecraft",
    title: "Minecraft",
    media_type: "game",
    year: 2011,
    cover_url: null,
    description: "A sandbox game.",
  },
  {
    id: "3",
    external_source: "sample",
    external_id: "example-1984",
    title: "1984",
    media_type: "book",
    year: 1949,
    cover_url: null,
    description: "A dystopian novel.",
  },
];

export default function Home() {
  return (
    <main>
      <div className="page-header">
        <h1>Discover what's trending.</h1>
        <p>Movies, shows, books, music, games, and more.</p>
      </div>

      <section className="media-section">
        <h2>Trending This Week</h2>
        <div className="media-grid">
          {media.map((item) => (
            <MediaCard key={item.id} media={item} />
          ))}
        </div>
      </section>

      <section className="media-banner">
        <h2>Got a Hot Take?</h2>
        <p>Rate what you love. Review what you hate.</p>
      </section>

      <section className="media-section">
        <h2>Popular in Games</h2>
        <div className="media-grid">
          {media
            .filter((item) => item.media_type === "game")
            .map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
        </div>
      </section>
    </main>
  );
}
