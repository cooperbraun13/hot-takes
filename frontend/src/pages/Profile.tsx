import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CircleUserRound, Heart } from "lucide-react";
import MediaCard from "../components/MediaCard";
import type { Media } from "../types";

interface StoredMedia extends Omit<Media, "id" | "description" | "extra"> {
  id: number;
  description: string | null;
  extra: Record<string, unknown> | null;
}
interface ProfileTake {
  id: number;
  media: StoredMedia;
  rating: number;
  comment: string | null;
  created_at: string;
}
function cardMedia(media: StoredMedia): Media {
  return { ...media, id: String(media.id), description: media.description ?? "", extra: media.extra ?? undefined };
}

export default function Profile() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [takes, setTakes] = useState<ProfileTake[]>([]);
  const [favorites, setFavorites] = useState<StoredMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pending, setPending] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  async function signOut() {
    if (signingOut || pending !== null) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST", credentials: "include",
      });
      if (!response.ok) throw new Error("Could not sign out. Please try again.");
      navigate("/login", { replace: true });
    } catch (err) {
      setSignOutError(err instanceof Error ? err.message : "Could not sign out.");
    } finally {
      setSigningOut(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const responses = await Promise.all(["/api/auth/me", "/api/me/takes", "/api/me/favorites"].map(
          (url) => fetch(url, { credentials: "include", signal: controller.signal }),
        ));
        if (controller.signal.aborted) return;
        if (responses.some((response) => response.status === 401)) {
          navigate("/login?next=/profile", { replace: true });
          return;
        }
        if (responses.some((response) => !response.ok)) throw new Error("Could not load your profile.");
        const [user, savedTakes, savedFavorites] = await Promise.all(responses.map((response) => response.json()));
        if (!controller.signal.aborted) {
          setUsername(user.username);
          setTakes(savedTakes);
          setFavorites(savedFavorites);
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not load your profile.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadProfile();
    return () => controller.abort();
  }, [navigate, retry]);

  async function toggleFavorite(media: StoredMedia) {
    if (pending !== null || signingOut) return;
    const isFavorite = favorites.some((item) => item.id === media.id);
    setPending(media.id);
    setActionError("");
    try {
      const response = await fetch(`/api/me/favorites/${media.id}`, {
        method: isFavorite ? "DELETE" : "PUT", credentials: "include",
      });
      if (response.status === 401) {
        navigate("/login?next=/profile", { replace: true });
        return;
      }
      if (!response.ok) throw new Error("Could not update your favorites. Please try again.");
      setFavorites((current) => isFavorite ? current.filter((item) => item.id !== media.id) : [media, ...current]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update your favorites.");
    } finally {
      setPending(null);
    }
  }

  function favoriteButton(media: StoredMedia) {
    const isFavorite = favorites.some((item) => item.id === media.id);
    return (
      <button className="favorite-button" type="button" disabled={pending !== null || signingOut}
        aria-pressed={isFavorite} aria-label={`${isFavorite ? "Remove" : "Add"} ${media.title} ${isFavorite ? "from" : "to"} favorites`}
        onClick={() => void toggleFavorite(media)}>
        <Heart size={16} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
        {pending === media.id ? "Saving..." : isFavorite ? "Favorited" : "Add to favorites"}
      </button>
    );
  }

  if (loading) return <main><p role="status">Loading your profile...</p></main>;
  if (error) return <main><p role="alert">{error}</p><button onClick={() => setRetry((value) => value + 1)}>Try again</button></main>;

  return (
    <main className="profile-page">
      <div className="page-header profile-heading">
        <div className="profile-avatar"><CircleUserRound size={80} strokeWidth={1.25} aria-hidden="true" /></div>
        <h1>{username}</h1>
        <p>Your favorites and latest takes, all in one place.</p>
        <Link className="profile-takes-link" to="/takes">Log a take</Link>
        <div>
          <button className="profile-sign-out" type="button" onClick={() => void signOut()} disabled={signingOut || pending !== null}>
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
        {signOutError && <p role="alert">{signOutError}</p>}
      </div>
      {actionError && <p role="alert">{actionError}</p>}
      <section className="media-section" aria-labelledby="favorites-heading">
        <h2 id="favorites-heading">Favorites</h2>
        {favorites.length === 0 && <p>Mark a title below as a favorite to display it here.</p>}
        <div className="media-grid">
          {favorites.map((media) => <article key={media.id}>
            <MediaCard media={cardMedia(media)} />
            {favoriteButton(media)}
          </article>)}
        </div>
      </section>
      <section className="media-section" aria-labelledby="latest-takes-heading">
        <h2 id="latest-takes-heading">Latest Takes</h2>
        {takes.length === 0 && <p>No takes yet. <Link to="/takes">Log your first take.</Link></p>}
        <div className="media-grid">
          {takes.slice(0, 8).map((take) => <article key={take.id}>
            <MediaCard media={cardMedia(take.media)} rating={take.rating} />
            {take.comment && <p className="profile-comment">{take.comment}</p>}
            {favoriteButton(take.media)}
          </article>)}
        </div>
        {takes.length > 8 && <Link className="profile-takes-link" to="/takes">View all takes</Link>}
      </section>
    </main>
  );
}
