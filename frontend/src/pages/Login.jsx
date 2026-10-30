import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiRequest, saveSession } from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const data = await apiRequest("/users/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveSession(data.token, data.user);
      navigate(location.state?.from || "/tasks", { replace: true });
    } catch (err) {
      setError(err.status === 401 ? "Incorrect email or password" : err.message || "Unable to log in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-container">
        <h1 className="login-heading">Welcome back</h1>
        <p className="login-intro">Log in to continue with LocalHelp.</p>
        {location.state?.message && <p className="login-message">{location.state.message}</p>}
        <form onSubmit={handleSubmit} className="login-card">
          <label className="login-field">Email
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="login-input" />
          </label>

          <label className="login-field">Password
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="login-input" />
          </label>

          {error && <p role="alert" className="login-error">{error}</p>}

          <button disabled={busy} className="login-submit">
          {busy ? "Logging in..." : "Login"}
          </button>

          <p className="login-register">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default Login;
