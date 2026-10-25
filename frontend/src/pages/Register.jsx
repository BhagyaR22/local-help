import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function Register() {
  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", contactNumber: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await apiRequest("/users/register", { method: "POST", body: JSON.stringify(form) });
      navigate("/login", { state: { message: "Account created. Please log in." } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-card">
        <p className="section-kicker">Join your local community</p>
        <h1 className="register-heading">Create your account</h1>
        <p className="register-intro">Request a service or offer a hand nearby. You can do both with one account.</p>

        <form onSubmit={handleSubmit} className="register-grid">
          <label>First name
            <input required maxLength={50} autoComplete="given-name" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="First name" />
          </label>
          <label>Last name
            <input required maxLength={50} autoComplete="family-name" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Last name" />
          </label>
          <label>Username
            <input required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" autoComplete="username" value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="e.g. bhagya_k" />
            <small>3–20 letters, numbers, or underscores.</small>
          </label>
          <label>Contact number
            <input required type="tel" maxLength={24} autoComplete="tel" value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} placeholder="e.g. +94 77 123 4567" />
            <small>Your number is only shared with the person who claims your request.</small>
          </label>
          <label className="register-full-width">Email address
            <input required type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="register-full-width">Password
            <input required minLength={6} type="password" autoComplete="new-password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="At least 6 characters" />
          </label>
          {error && <p role="alert" className="register-error register-full-width">{error}</p>}
          <div className="register-full-width register-actions">
            <button disabled={busy} className="request-submit">{busy ? "Creating account…" : "Create account"}</button>
            <p>Already have an account? <Link to="/login">Log in</Link></p>
          </div>
        </form>
      </section>
    </main>
  );
}

export default Register;
