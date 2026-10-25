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
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800">Login</h1>
      {location.state?.message && <p className="mt-4 text-green-700">{location.state.message}</p>}
      <form onSubmit={handleSubmit} className="mt-8 max-w-xl rounded-lg bg-white p-6 shadow">
        <label className="block font-semibold">Email</label>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded border p-3" />

        <label className="mt-6 block font-semibold">Password</label>
        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded border p-3" />

        {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}

        <button disabled={busy} className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white disabled:opacity-60">
          {busy ? "Logging in..." : "Login"}
        </button>

        <p className="mt-6 text-gray-600">
          Don't have an account? <Link to="/register" className="font-semibold text-blue-600">Register</Link>
        </p>
      </form>
    </main>
  );
}

export default Login;
