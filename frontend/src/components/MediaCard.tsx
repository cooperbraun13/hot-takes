import { Film, Tv, BookOpen, Music, Gamepad2, Mic } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [details, setDetails] = useState<{
    key: string;
    title: string;
    coverUrl: string | null;
  } | null>(null);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const displayAlbum = media.media_type === "music" && media.extra?.displayAs === "album";
  const mediaKey = JSON.stringify([
    media.media_type, media.external_source, media.external_id, displayAlbum,
  ]);

  useEffect(() => {
    // Discovery responses already contain the title and cover.
    if (media.extra?.discovery) return;
    const isMovie = media.media_type === "movie" && media.external_source === "tmdb";
    const isTv = media.media_type === "tv" && media.external_source === "tmdb";
    const isGame = media.media_type === "game" && media.external_source === "twitch";
    const isBook = media.media_type === "book" && media.external_source === "local";
    const isMusic = media.media_type === "music" && media.external_source === "spotify";
    if (!isMovie && !isTv && !isGame && !isBook && !isMusic) return;

    const controller = new AbortController();
    const endpoint = isBook ? "books" : isMusic ? "music" : isGame ? "games" : isTv ? "tv" : "movies";
    async function loadMedia() {
      try {
        const response = await fetch(
          `/api/${endpoint}/${encodeURIComponent(media.external_id)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Media request failed: ${response.status}`);
        const data = await response.json();
        if (!controller.signal.aborted) {
          setDetails({
            key: mediaKey,
            title: (displayAlbum ? data.album : data.title) || media.title,
            coverUrl: (isBook ? data.cover_url : isGame || isMusic ? data.imageUrl : data.posterUrl) || null,
          });
        }
      } catch {
        // Keep the supplied media and icon if the request fails.
      }
    }
    void loadMedia();
    return () => controller.abort();
  }, [mediaKey, media.media_type, media.external_source, media.external_id, media.title, displayAlbum, media.extra?.discovery]);

  const currentDetails = details?.key === mediaKey ? details : null;
  const title = currentDetails?.title ?? media.title;
  const posterUrl = currentDetails ? currentDetails.coverUrl : media.cover_url;
  // Normalize duplicated size segments returned by the existing TMDB adapter.
  const coverUrl = posterUrl?.replace(
    /^(https:\/\/image\.tmdb\.org\/t\/p\/)(?:w\d+|original)\/(w\d+|original)\//,
    "$1$2/",
  );

  return (
    <button
      className="media-card"
      onClick={() => navigate(`/media/${media.id}`)}
    >
      <div className="media-content">
        {coverUrl && failedImage !== coverUrl ? (
          <img
            src={coverUrl}
            alt={`${title} cover`}
            loading="lazy"
            onError={() => setFailedImage(coverUrl)}
          />
        ) : (
          <div className="media-placeholder">
            <Icon size={40} strokeWidth={1.5} />
          </div>
        )}

        <h3>{title}</h3>
        <p>{displayAlbum ? "Music album" : media.media_type}</p>

        {rating !== undefined && <p className="media-rating">★ {rating}/5</p>}
      </div>
    </button>
  );
}
