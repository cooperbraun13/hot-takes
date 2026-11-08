import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import MediaSearch, { type MediaSelection } from "../components/MediaSearch";
import MediaCard from "../components/MediaCard";
import type { Media, MediaType } from "../types";

type Entry = { id: number; media: Omit<Media, "id" | "description" | "extra"> & {
  id: number; description: string | null; extra: Record<string, unknown> | null;
} };
type SavedList = { id: number; name: string; entries: Entry[] };
const categories: { type: MediaType; label: string }[] = [
  { type: "movie", label: "Movies" }, { type: "tv", label: "TV Shows" },
  { type: "music", label: "Music" }, { type: "game", label: "Games" },
  { type: "book", label: "Books" },
];

export default function MyLists() {
  const [lists, setLists] = useState<SavedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [category, setCategory] = useState<MediaType>("movie");
  const [selected, setSelected] = useState<MediaSelection | null>(null);
  const [searchVersion, setSearchVersion] = useState(0);
  const active = lists.find((list) => list.id === activeId);

  async function checkResponse(response: Response) {
    if (response.status === 401) {
      setNeedsLogin(true);
      throw new Error("Please log in to manage your lists.");
    }
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(typeof data?.detail === "string" ? data.detail : "Could not save your changes.");
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/me/lists", { credentials: "include", signal: controller.signal });
        if (response.status === 401) { setNeedsLogin(true); return; }
        if (!response.ok) throw new Error("Could not load your lists. Refresh to try again.");
        const data: SavedList[] = await response.json();
        if (!controller.signal.aborted) {
          setLists(data);
          setActiveId(data[0]?.id ?? null);
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not load lists.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  async function createList(event: FormEvent) {
    event.preventDefault();
    if (saving || !name.trim()) return;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/lists", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      await checkResponse(response);
      const saved: SavedList = await response.json();
      setLists((current) => [saved, ...current]); setActiveId(saved.id); setName("");
      setSelected(null); setSearchVersion((v) => v + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create list."); }
    finally { setSaving(false); }
  }

  async function addMedia(event: FormEvent) {
    event.preventDefault();
    if (!active || !selected || selected.media_type !== category || saving) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/lists/${active.id}/items`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });
      await checkResponse(response);
      const saved: SavedList = await response.json();
      setLists((current) => current.map((list) => list.id === saved.id ? saved : list));
      setSelected(null); setSearchVersion((v) => v + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not add title."); }
    finally { setSaving(false); }
  }

  async function removeEntry(entryId: number) {
    if (!active || saving) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/lists/${active.id}/items/${entryId}`, { method: "DELETE", credentials: "include" });
      await checkResponse(response);
      setLists((current) => current.map((list) => list.id === active.id
        ? { ...list, entries: list.entries.filter((entry) => entry.id !== entryId) } : list));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not remove title."); }
    finally { setSaving(false); }
  }

  if (loading) return <main><p role="status">Loading your lists...</p></main>;
  if (needsLogin) return <main><p><Link to="/login">Log in</Link> to view and save your lists.</p></main>;

  return <main className="my-takes-page my-lists-page">
    <div className="page-header"><h1>My Lists</h1><p>Create collections of movies, TV, music, games, and books.</p></div>
    {error && <p role="alert">{error}</p>}
    <section className="media-section">
      <h2>Create a list</h2>
      <form className="take-form" onSubmit={createList}>
        <fieldset disabled={saving}>
          <legend>New list</legend>
          <label htmlFor="list-name">List name</label>
          <input id="list-name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Weekend watchlist" />
          <button type="submit" disabled={!name.trim() || saving}>Create list</button>
        </fieldset>
      </form>
    </section>
    <section className="media-section">
      <h2>Your Lists</h2>
      <div className="filter-row" aria-label="Choose a list">
        {lists.map((list) => <button key={list.id} disabled={saving} className={activeId === list.id ? "active" : ""}
          aria-pressed={activeId === list.id} onClick={() => {
            setActiveId(list.id); setSelected(null); setSearchVersion((v) => v + 1); setError("");
          }}>{list.name} ({list.entries.length})</button>)}
      </div>
      {!lists.length && <p>Create your first list above.</p>}
      {active && <>
        <h3>{active.name}</h3>
        <form className="take-form" onSubmit={addMedia}>
          <fieldset disabled={saving}>
            <legend>Add media</legend>
            <label htmlFor="list-category">Media type</label>
            <select id="list-category" value={category} onChange={(e) => {
              setCategory(e.target.value as MediaType); setSelected(null); setError("");
            }}>{categories.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}</select>
            <MediaSearch key={`${category}-${searchVersion}`} category={category} value={selected} onChange={setSelected} />
            <button type="submit" disabled={!selected || saving}>{saving ? "Saving..." : "Add to list"}</button>
          </fieldset>
        </form>
        <div className="media-grid">
          {active.entries.map((entry) => <article key={entry.id}>
            <MediaCard media={{ ...entry.media, id: String(entry.media.id), description: entry.media.description ?? "", extra: entry.media.extra ?? undefined }} />
            <button className="list-remove" disabled={saving} onClick={() => void removeEntry(entry.id)} aria-label={`Remove ${entry.media.title} from ${active.name}`}>Remove</button>
          </article>)}
        </div>
        {!active.entries.length && <p className="takes-empty">No titles yet. Choose a media type and search above to add one.</p>}
      </>}
    </section>
  </main>;
}
