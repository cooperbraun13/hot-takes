import { useEffect, useState } from "react";
import type { Media } from "../types";

interface MediaCardProps {
  media: Media;
  rating?: number;
}

function MediaCard({ media, rating }: MediaCardProps) {
  const [movie, setMovie] = useState<{
    externalId: string;
    mediaType: Media["media_type"];
    title: string;
    posterUrl: string | null;
  } | null>(null);
  const [game, setGame] = useState<{
    externalId: string;
    title: string;
    coverUrl: string | null;
  } | null>(null);
  
  const [failedImage, setFailedImage] = useState<string | null>(null);

  useEffect(() => {
    const isMovie = media.media_type === "movie" && media.external_source === "tmdb";
    const isTv = media.media_type === "tv" && media.external_source === "tmdb";
    const isGame = media.media_type === "game" && media.external_source === "twitch";
    if (!isMovie && !isTv && !isGame) {
      return;
    }

    const controller = new AbortController();
    async function loadTmdb() {
      try {
        const response = await fetch(
          `/api/${isTv ? "tv" : "movies"}/${encodeURIComponent(media.external_id)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`TMDB request failed: ${response.status}`);
        const details = await response.json();
        if (!controller.signal.aborted) {
          setMovie({
            externalId: media.external_id,
            mediaType: media.media_type,
            title: details.title || media.title,
            posterUrl: details.posterUrl || null,
          });
        }
      } catch {
        // Keep the supplied media and icon if the request fails.
      }
    }

    async function loadGame() {
      try {
        const response = await fetch(
          `/api/games/${encodeURIComponent(media.external_id)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Game request failed: ${response.status}`);
        const details = await response.json();
        if (!controller.signal.aborted) {
          setGame({
            externalId: media.external_id,
            title: details.title || media.title,
            coverUrl: details.imageUrl || null,
          });
        }
      } catch {
        // Keep the supplied media and icon if the request fails.
      }
    }

    if (isMovie || isTv) void loadTmdb();
    if (isGame) void loadGame();
    return () => controller.abort();
  }, [media.media_type, media.external_source, media.external_id, media.title]);

  const currentMovie = (media.media_type === "movie" || media.media_type === "tv") &&
    movie?.mediaType === media.media_type &&
    media.external_source === "tmdb" && movie?.externalId === media.external_id
    ? movie
    : null;
  const currentGame = media.media_type === "game" &&
    media.external_source === "twitch" && game?.externalId === media.external_id
    ? game
    : null;
  const title = currentMovie?.title ?? currentGame?.title ?? media.title;
  const posterUrl = currentMovie ? currentMovie.posterUrl
    : currentGame ? currentGame.coverUrl : media.cover_url;
  // The existing backend can return /t/p/w500/w500/... .
  const coverUrl = posterUrl?.replace(
    /^(https:\/\/image\.tmdb\.org\/t\/p\/)(?:w\d+|original)\/(w\d+|original)\//,
    "$1$2/",
  );
  
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
        {coverUrl && failedImage !== coverUrl ? (
          <img
            src={coverUrl}
            alt={`${title} cover`}
            loading="lazy"
            onError={() => setFailedImage(coverUrl)}
          />
        ) : (
          <span className="media-placeholder" aria-hidden="true">
            {icons[media.media_type]}
          </span>
        )}
        <div>
          <h3>{title}</h3>
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
