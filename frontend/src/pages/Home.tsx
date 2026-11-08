import MediaCard from "../components/MediaCard";
import type { Media, MediaType } from "../types";

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
    external_source: "twitch",
    external_id: "27471",
    title: "Minecraft",
    media_type: "game",
    year: 2011,
    cover_url: null,
    description: "A sandbox game.",
  },
  {
    id: "3",
    external_source: "local",
    external_id: "1984",
    title: "1984",
    media_type: "book",
    year: 1949,
    cover_url: null,
    description: "A dystopian novel.",
  },
  {
    id: "4",
    external_source: "tmdb",
    external_id: "97400",
    title: "Midnight Mass",
    media_type: "tv",
    year: 2021,
    cover_url: null,
    description: "Religious supernatural horror drama mini-series.",
  },
];

export default function Home({ mediaType }: { mediaType?: MediaType }) {
  const categoryLabels: Record<MediaType, string> = {
    movie: "Movies",
    tv: "TV Shows",
    music: "Music",
    game: "Games",
    book: "Books",
    podcast: "Podcasts",
  };
  const category = mediaType ? categoryLabels[mediaType] : null;
  const visibleMedia = mediaType
    ? media.filter((item) => item.media_type === mediaType)
    : media;
  return (
    <main>
      <div className="page-header">
        <h1>{category ? `Discover ${category}.` : "Discover what's trending."}</h1>
        <p>{category ? `Explore ${category.toLowerCase()} and find your next favorite.` : "Movies, shows, books, music, games, and more."}</p>
      </div>

      <section className="media-section">
        <h2>{category ? `Trending ${category}` : "Trending This Week"}</h2>
        <div className="media-grid">
          {visibleMedia.map((item) => (
            <MediaCard key={item.id} media={item} />
          ))}
        </div>
        {visibleMedia.length === 0 && (
          <p>No {category?.toLowerCase()} added yet.</p>
        )}
      </section>

      <section className="media-banner">
        <h2>Got a Hot Take?</h2>
        <p>Rate what you love. Review what you hate.</p>
      </section>

      {!mediaType && <section className="media-section">
        <h2>Popular in Games</h2>
        <div className="media-grid">
          {media
            .filter((item) => item.media_type === "game")
            .map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
        </div>
      </section>}
    </main>
  );
}
