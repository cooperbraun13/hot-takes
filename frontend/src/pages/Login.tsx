import { useState } from "react";
import { Link, useNavigate } from "react-router";
import "../styles/login.css";


function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        if (!username.trim() || !password.trim()) {
            setError("Please fill in all fields.");
            return;
        }
        // Simulate a successful login
        navigate("/my-takes");
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
                    <button type="submit">Login</button>
                </form>
                <p className="login-signup">
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </div>
        </main>
    );
}

export default Login;
