import { useState } from "react";
import { Link, useNavigate } from "react-router";
import "../styles/login.css";
async function responseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  return typeof body?.detail === "string"
    ? body.detail
    : `Request failed (${response.status}).`;
}


function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;
        setError("");
        if (!username.trim() || !password.trim()) {
            setError("Please fill in all fields.");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), password }),
            });
            if (!response.ok) throw new Error(await responseError(response));
            navigate("/takes", { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed.");
        } finally {
            setLoading(false);
        }
    }
    return (
        <main>
            <div className="login-container">
                <div className="page-header">
                    <h1>Login</h1>
                    <p>Welcome back to Hot Takes! Please Log In.</p>
                </div>
                <form className="login-form" onSubmit={handleSubmit}>
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && <p className="login-error">{error}</p>}
                    <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
                </form>
                <p className="login-signup">
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </div>
        </main>
    );
}

export default Login;
