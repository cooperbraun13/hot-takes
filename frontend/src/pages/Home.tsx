import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import MediaCard, { type Media } from "../components/MediaCard";

const categories: Record<string, string> = {
  movies: "movie",
  tv: "tv",
  books: "book",
  music: "album",
  games: "game",
};

export default function Home() {
  const [media, setMedia] = useState<Media[]>([]);
  const [error, setError] = useState("");
  const { pathname } = useLocation();

  useEffect(() => {
    fetch("/api/media")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load media");
        return res.json();
      })
      .then(setMedia)
      .catch(() => setError("Could not load media."));
  }, []);

  const category = pathname.slice(1);
  const filtered = categories[category]
    ? media.filter((item) => item.type === categories[category])
    : media;

  return (
    <main>
      <div className="page-header">
        <h1>{category || "Explore"}</h1>
        <p>Discover your next favorite.</p>
      </div>

      {error && <p>{error}</p>}

      <div className="media-grid">
        {filtered.map((item) => (
          <MediaCard key={item.id} media={item} />
        ))}
      </div>
    </main>
  );
}
