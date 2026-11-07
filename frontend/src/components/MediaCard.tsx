import type { Media } from "../types";

interface MediaCardProps {
  media: Media;
  rating?: number;
}

function MediaCard({ media, rating }: MediaCardProps) {
  const icons = {
    movie: "🎬",
    tv: "📺",
    book: "📚",
    music: "🎵",
    game: "🎮",
    podcast: "🎙️",
  };
  function handleClick() {
    window.location.assign(`/media/${media.id}`);
  }

  return (
    <button className="media-card" onClick={handleClick}>
      <div className="media-content">
        {media.cover_url ? (
          <img src={media.cover_url} alt={`${media.title} cover`} />
        ) : (
          <span>{icons[media.media_type]}</span>
        )}
        <div>
          <h3>{media.title}</h3>
          <p>{media.media_type}</p>
          {rating !== undefined && (
            <p className="media-rating"> * {rating}/5</p>
          )}
        </div>
      </div>
    </button>
  );
}

export default MediaCard;
