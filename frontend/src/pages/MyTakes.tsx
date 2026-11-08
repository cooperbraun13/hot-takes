
import { useState } from "react";
import MediaCard from "../components/MediaCard";
import type {
  MediaCategory,
  MediaType,
  Take,
} from "../types";

import "../styles/globals.css";

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

const mockTakes: Take[] = [
  {
    id: "1",
    media: {
      id: "1",
      media_type: "movie",
      external_source: "tmdb",
      external_id: "27205",
      title: "Inception",
      year: 2010,
      cover_url: null,
      description: "A science fiction movie.",
    },
    rating: 4.5,
    comment: "Really good movie.",
    created_at: "2026-11-07",
  },
  {
    id: "2",
    media: {
      id: "2",
      media_type: "music",
      external_source: "spotify",
      external_id: "example-album",
      title: "Example Album",
      year: 2024,
      cover_url: null,
      description: "A sample album.",
    },
    rating: 5,
    comment: "Great album.",
    created_at: "2026-11-07",
  },
  {
    id: "3",
    media: {
      id: "3",
      media_type: "game",
      external_source: "igdb",
      external_id: "example-game",
      title: "Example Game",
      year: 2023,
      cover_url: null,
      description: "A sample game.",
    },
    rating: 4,
    comment: "Fun gameplay.",
    created_at: "2026-11-07",
  },
];

function MyTakes() {
  const [takes] = useState<Take[]>(mockTakes);

  const [selectedType, setSelectedType] =
    useState<MediaType | "all">("all");

  const filteredTakes = takes.filter((take) => {
    return (
      selectedType === "all" ||
      take.media.media_type === selectedType
    );
  });

  return (
    <main className="my-takes-page">
      <div className="page-header">
        <h1>My Takes</h1>
        <p>Your ratings for movies, shows, music, games, and more.</p>
      </div>

      <section className="media-section takes-section">
        <h2>Your Ratings</h2>

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
            <MediaCard
              key={take.id}
              media={take.media}
              rating={take.rating}
            />
          ))}
        </div>

        {filteredTakes.length === 0 && (
          <p className="takes-empty" role="status">You haven't logged any takes in this category.</p>
        )}
      </section>

    </main>
  );
}

export default MyTakes;
