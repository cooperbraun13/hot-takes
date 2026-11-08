import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Search } from "lucide-react";

// Search box in the navbar. Pressing Enter goes to /search?q=...
export default function NavSearch() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (q.length >= 2) navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form className="nav-search" role="search" onSubmit={handleSubmit}>
      <Search size={16} aria-hidden="true" />
      <input
        type="search"
        placeholder="Search movies, books, music..."
        aria-label="Search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </form>
  );
}
