import { Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

// Pages where the button would be pointless.
const HIDDEN_ON = ["/takes", "/login", "/signup"];

export default function AddTakeButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (HIDDEN_ON.includes(pathname)) return null;

  async function handleClick() {
    // Ask the backend who is logged in: 200 = logged in, 401 = not.
    const response = await fetch("/api/auth/me", { credentials: "include" }).catch(() => null);
    navigate(response?.ok ? "/takes" : "/login");
  }

  return (
    <button
      type="button"
      className="add-take-button"
      onClick={handleClick}
      aria-label="Add a take"
      title="Add a take"
    >
      <Plus size={28} strokeWidth={2.75} />
    </button>
  );
}
