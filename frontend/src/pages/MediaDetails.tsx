import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router";
import type { Media, MediaType } from "../types";

type Details = Record<string, unknown>;
const endpoints: Partial<Record<MediaType, string>> = {
  movie: "movies", tv: "tv", music: "music", game: "games", book: "books",
};
const icons: Record<string, string> = { movie: "🎬", tv: "📺", music: "🎵", game: "🎮", book: "📚" };
function imageUrl(value: unknown) {
  return typeof value === "string" ? value.replace(
    /^(https:\/\/image\.tmdb\.org\/t\/p\/)(?:w\d+|original)\/(w\d+|original)\//, "$1$2/",
  ) : null;
}
function Picture({ value, alt, className = "" }: { value: unknown; alt: string; className?: string }) {
  const url = imageUrl(value);
  const [failed, setFailed] = useState<string | null>(null);
  return url && failed !== url
    ? <img className={className} src={url} alt={alt} loading="lazy" onError={() => setFailed(url)} />
    : null;
}
function label(key: string) {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
}
function content(value: unknown, key: string): ReactNode {
  if (value === null || value === undefined || value === "") return <span>Not available</span>;
  if (key === "runtime" && typeof value === "number") return `${value} minutes`;
  if (Array.isArray(value)) {
    if (!value.length) return <span>Not available</span>;
    if (value.every((item) => typeof item === "string")) return value.join(", ");
    return <div className="detail-collection">{value.map((item, index) => <div className="detail-item" key={index}>{content(item, key)}</div>)}</div>;
  }
  if (typeof value === "object") return <Metadata details={value as Details} />;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^(https?:\/\/|\/images\/)/.test(value)) {
    if (/url$/i.test(key) && /photo|poster|backdrop|image|cover|still/i.test(key)) return <Picture value={value} alt={label(key)} />;
    return <a href={value} target="_blank" rel="noreferrer">{key === "spotifyUrl" ? "Listen on Spotify" : "Open link"}</a>;
  }
  return String(value);
}
function Metadata({ details, omit = [] }: { details: Details; omit?: string[] }) {
  return <dl className="detail-metadata">{Object.entries(details).filter(([key]) => !omit.includes(key)).map(([key, value]) => (
    <div key={key}><dt hidden={/photo_?url/i.test(key)}>{label(key)}</dt><dd>{content(value, key)}</dd></div>
  ))}</dl>;
}

export default function MediaDetails() {
  const { mediaType = "", source = "", externalId = "" } = useParams();
  const location = useLocation();
  const original = (location.state as { media?: Media } | null)?.media;
  const key = `${mediaType}/${source}/${externalId}`;
  const [result, setResult] = useState<{ key: string; data: Details | null; error: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const endpoint = endpoints[mediaType as MediaType];
        if (!endpoint) throw new Error("This media type is not supported yet.");
        const response = await fetch(`/api/${endpoint}/${encodeURIComponent(externalId)}`, { signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 404 ? "This title could not be found." : "Could not load details. Please refresh to try again.");
        const data: Details = await response.json();
        if (!controller.signal.aborted) setResult({ key, data, error: "" });
      } catch (err) {
        if (!controller.signal.aborted) setResult({ key, data: null, error: err instanceof Error ? err.message : "Could not load details." });
      }
    }
    void load();
    return () => controller.abort();
  }, [key, mediaType, externalId]);

  const current = result?.key === key ? result : null;
  const data = current?.data;
  const title = typeof data?.title === "string" ? data.title : original?.title ?? "Media details";
  const poster = data?.posterUrl ?? data?.imageUrl ?? data?.cover_url ?? original?.cover_url;
  const overview = data?.overview ?? data?.description;
  const trailer = typeof data?.trailerKey === "string" ? data.trailerKey : null;

  async function saveTake(event: FormEvent) {
    event.preventDefault();
    if (!data || saving) return;
    setSaving(true); setSaveError(""); setSaveMessage(""); setNeedsLogin(false);
    const release = data.releaseDate ?? data.firstAirDate ?? data.firstPublishDate;
    const year = original?.year ?? (typeof data.year === "number" ? data.year
      : typeof release === "string" ? Number(release.match(/\b\d{4}\b/)?.[0]) || null : null);
    try {
      const response = await fetch("/api/takes", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media: { media_type: mediaType, external_source: source,
          external_id: externalId, title, year, cover_url: imageUrl(poster) },
          rating, comment: comment.trim() || null, watched_on: null }),
      });
      if (response.status === 401) { setNeedsLogin(true); return; }
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(typeof body?.detail === "string" ? body.detail : "Could not save your take.");
      }
      setSaveMessage("Take saved."); setShowForm(false); setComment("");
    } catch (err) { setSaveError(err instanceof Error ? err.message : "Could not save your take."); }
    finally { setSaving(false); }
  }

  if (!current) return <main><p role="status">Loading media details...</p></main>;
  if (!data) return <main><p role="alert">{current.error}</p><Link to="/">Back to Home</Link></main>;
  return <main className="media-details" key={key}>
    <Link className="detail-back" to="/">← Explore media</Link>
    <div className="detail-hero">
      <div className="detail-poster">{poster ? <Picture value={poster} alt={`${title} cover`} /> : <span>{icons[mediaType]}</span>}</div>
      <div>
        <div className="page-header"><h1>{title}</h1><p>{label(mediaType)}</p></div>
        {typeof data.tagline === "string" && data.tagline && <p className="detail-tagline">{data.tagline}</p>}
        {typeof overview === "string" && <p className="detail-overview">{overview}</p>}
        <div className="detail-summary">
          <Metadata details={data} omit={[
            "title", "tagline", "overview", "description", "posterUrl", "imageUrl",
            "cover_url", "trailerKey", "previewUrl", "external_id", "externalId",
            "id", "backdropUrl", "cast",
          ]} />
        </div>
        <button className="detail-add" onClick={() => { setShowForm((v) => !v); setSaveMessage(""); }} aria-expanded={showForm}>＋ Add take</button>
        {saveMessage && <p role="status">{saveMessage} <Link to="/takes">View My Takes</Link></p>}
      </div>
    </div>
    {showForm && <section className="media-section">
      <h2>Add your take</h2>
      <form className="take-form" onSubmit={saveTake}><fieldset disabled={saving}>
        <legend>Rate {title}</legend>
        <label htmlFor="detail-rating">Rating</label>
        <select id="detail-rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {Array.from({ length: 10 }, (_, i) => (i + 1) / 2).map((r) => <option key={r} value={r}>{r} / 5</option>)}
        </select>
        <label htmlFor="detail-comment">Your take (optional)</label>
        <textarea id="detail-comment" maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} />
        <button type="submit">{saving ? "Saving..." : "Save take"}</button>
      </fieldset>
      {saveError && <p role="alert">{saveError}</p>}
      {needsLogin && <p><Link to="/login">Log in</Link> to save your take.</p>}
      </form>
    </section>}
    {(mediaType === "movie" || mediaType === "tv") && <section className="media-section">
      <h2>Trailer</h2>
      {trailer ? <>
        <iframe className="detail-trailer" src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer)}`} title={`${title} trailer`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
        <p><a href={`https://www.youtube.com/watch?v=${encodeURIComponent(trailer)}`} target="_blank" rel="noreferrer">Watch trailer on YouTube</a></p>
      </> : <p>No trailer available for this title.</p>}
    </section>}
    {typeof data.previewUrl === "string" && data.previewUrl && <section className="media-section"><h2>Music preview</h2><audio controls preload="none" src={data.previewUrl}>Your browser does not support audio playback.</audio></section>}
    {Array.isArray(data.cast) && data.cast.length > 0 && (
      <section className="media-section"><h2>Cast</h2>{content(data.cast, "cast")}</section>
    )}
  </main>;
}
