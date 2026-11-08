import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import "../styles/login.css";

function Signup() {

    const navigate = useNavigate();
    const [params] = useSearchParams();
    const destination = params.get("next") === "/profile" ? "/profile" : "/takes";
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;
        setError("");
        if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
            setError("Please fill in all fields.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        } 
        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: username.trim(), password }),
            });
            if (!response.ok) {
                const body = await response.json().catch(() => null);
                throw new Error(
                    typeof body?.detail === "string"
                        ? body.detail
                        : "Failed to create account.",
                );
            }
            navigate(destination, { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create account.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main>
            <div className="signup-container">
                <div className="page-header">
                    <h1>Sign Up</h1>
                    <p>Create an account to join Hot Takes!</p>
                </div>
                <form className="signup-form" onSubmit={handleSubmit}>
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {error && <p className="signup-error" role="alert">{error}</p>}
                    <button type="submit" disabled={loading}>
                        {loading ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>
                <p className="signup-login">
                    Already have an account? <Link to={destination === "/profile" ? "/login?next=/profile" : "/login"}>Login</Link>
                </p>
            </div>
        </main>
    );
}

export default Signup;
