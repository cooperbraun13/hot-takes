import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <Link to="/profile">Profile</Link>
        <Link to="/takes">My Takes</Link>
        <Link to="/grid">Grid Game</Link>
        <Link to="/lists">My Lists</Link>
      </div>
      <p>Hot Takes</p>
    </footer>
  );
}
