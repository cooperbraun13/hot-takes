import { Film, Tv, BookOpen, Music, Gamepad2, Mic } from "lucide-react";
import { useNavigate } from "react-router";
import type { Media } from "../types";

interface MediaCardProps {
  media: Media;
  rating?: number;
}

const icons = {
  movie: Film,
  tv: Tv,
  book: BookOpen,
  music: Music,
  game: Gamepad2,
  podcast: Mic,
};

export default function MediaCard({ media, rating }: MediaCardProps) {
  const navigate = useNavigate();
  const Icon = icons[media.media_type];

  return (
    <button
      className="media-card"
      onClick={() => navigate(`/media/${media.id}`)}
    >
      <div className="media-content">
        {media.cover_url ? (
          <img src={media.cover_url} alt={`${media.title} cover`} />
        ) : (
          <div className="media-placeholder">
            <Icon size={40} strokeWidth={1.5} />
          </div>
        )}

        <h3>{media.title}</h3>
        <p>{media.media_type}</p>

        {rating !== undefined && <p className="media-rating">★ {rating}/5</p>}
      </div>
    </button>
  );
}
