import { NavLink } from "react-router";
import { Flame, CircleUserRound } from "lucide-react";
import NavSearch from "./NavSearch";

const categories = [
  { name: "Home", path: "/" },
  { name: "Movies", path: "/movies" },
  { name: "TV", path: "/tv" },
  { name: "Books", path: "/books" },
  { name: "Music", path: "/music" },
  { name: "Games", path: "/games" },
];

export default function Navbar() {
  return (
    <header className="site-header">
      <nav className="navbar">
        <NavLink to="/" className="logo">
          <Flame size={24} strokeWidth={2.5} color="#f97316" />
          <span>Hot Takes</span>
        </NavLink>

        <div className="nav-links">
          {categories.map((category) => (
            <NavLink
              key={category.path}
              to={category.path}
              end
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {category.name}
            </NavLink>
          ))}
        </div>
        <NavSearch />
        <NavLink to="/profile" className="profile-link" aria-label="Your profile" title="Your profile">
          <CircleUserRound size={28} aria-hidden="true" />
        </NavLink>
      </nav>
    </header>
  );
}
