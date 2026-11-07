import CategoryCard from "../components/CategoryCard";
import MediaCard from "../components/MediaCard";
import type { Media, MediaCategory } from "../types";

const categories: MediaCategory[] = [
  { id: "movie", name: "Movies", icon: "🎬", path: "/movies", available: true },
  { id: "tv", name: "TV", icon: "📺", path: "/tv", available: true },
  { id: "book", name: "Books", icon: "📚", path: "/books", available: true },
  { id: "music", name: "Music", icon: "🎵", path: "/music", available: true },
  { id: "game", name: "Games", icon: "🎮", path: "/games", available: true },
  { id: "podcast", name: "Podcasts", icon: "🎙️", path: "/podcasts", available: true },
];

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
      <h1>Explore</h1>
      <p>Discover your next favorite.</p>

      <h2>Categories</h2>
      <div className="category-grid">
        {categories.map((category) => (
          <CategoryCard key={category.path} category={category} />
        ))}
      </div>

      <h2>Featured Media</h2>
      <div className="media-grid">
        {media.map((item) => (
          <MediaCard key={item.id} media={item} />
        ))}
      </div>
    </main>
  );
}
