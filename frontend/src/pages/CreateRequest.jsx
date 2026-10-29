import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getToken, apiRequest } from "../services/api";
import { SERVICE_CATEGORIES } from "../data/serviceCategories";

function CreateRequest() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") === "offer" ? "offer" : "request");
  const [form, setForm] = useState({ title: "", description: "", category: "", location: "", dueDate: "", budget: "" });
  const [offerForm, setOfferForm] = useState({ category: "Cleaning", price: "", location: "", description: "" });
  const [error, setError] = useState("");
  const [offerError, setOfferError] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [offerBusy, setOfferBusy] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateOffer(field, value) {
    setOfferForm((current) => ({ ...current, [field]: value }));
  }

  function requireLogin() {
    navigate("/login", { state: { from: "/create-request", message: "Log in to post a service." } });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!getToken()) return requireLogin();

    setBusy(true);
    try {
      await apiRequest("/tasks", { method: "POST", body: JSON.stringify(form) });
      navigate("/services");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleOfferSubmit(event) {
    event.preventDefault();
    setOfferError("");
    setOfferMessage("");
    if (!getToken()) return requireLogin();

    setOfferBusy(true);
    try {
      await apiRequest("/offers", {
        method: "POST",
        body: JSON.stringify({ ...offerForm, price: Number(offerForm.price) }),
      });
      setOfferMessage(`Your ${offerForm.category.toLowerCase()} price has been saved.`);
      setOfferForm((current) => ({ ...current, price: "", location: "", description: "" }));
    } catch (err) {
      setOfferError(err.message);
    } finally {
      setOfferBusy(false);
    }
  }

  return (
    <main className="request-page">
      <div className="request-container">
        <p className="section-kicker">One account, both ways to help</p>
        <h1 className="request-heading">How can LocalHelp help you?</h1>
        <p className="request-intro">Request help with your budget, or list a service with your price per job. You can do both.</p>

        <div className="request-tabs" role="tablist" aria-label="Choose a service action">
          <button type="button" role="tab" aria-selected={mode === "request"} className={mode === "request" ? "request-tab active" : "request-tab"} onClick={() => setMode("request")}>Request help</button>
          <button type="button" role="tab" aria-selected={mode === "offer"} className={mode === "offer" ? "request-tab active" : "request-tab"} onClick={() => setMode("offer")}>Offer a service</button>
        </div>

        {mode === "request" ? (
          <section className="request-form-card" role="tabpanel">
            <div className="request-form-heading">
              <span className="request-form-icon" aria-hidden="true">⌂</span>
              <div><h2>Request help</h2><p>Tell neighbors what you need and the budget you are offering. It will appear under People needing help.</p></div>
            </div>
            <form onSubmit={handleSubmit} className="request-form-grid">
              <label>What do you need help with?
                <input required maxLength={120} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Install a kitchen shelf" />
              </label>
              <label>Service category
                <select required value={form.category} onChange={(e) => update("category", e.target.value)}>
                  <option value="">Select a category</option>
                  {SERVICE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label>Your area
                <input required maxLength={120} value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="e.g. Colombo" />
              </label>
              <label>Budget offered (LKR)
                <input required type="number" min="0" step="1" value={form.budget} onChange={(e) => update("budget", e.target.value)} placeholder="e.g. 2500" />
              </label>
              <label>Needed by (optional)
                <input type="date" min={new Date().toISOString().slice(0, 10)} value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} />
              </label>
              <label className="request-full-width">Describe the task
                <textarea required rows="4" maxLength={2000} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Add details that will help someone understand what you need." />
              </label>
              <div className="request-form-actions request-full-width">
                {error && <p role="alert" className="request-error">{error}</p>}
                {!getToken() && <p className="request-login-note">Please <Link to="/login">log in</Link> to post a request.</p>}
                <button disabled={busy} className="request-submit">{busy ? "Submitting…" : "Post help request"}</button>
              </div>
            </form>
          </section>
        ) : (
          <section className="request-form-card" role="tabpanel">
            <div className="request-form-heading">
              <span className="request-form-icon price-icon" aria-hidden="true">₹</span>
              <div><h2>Offer a service</h2><p>Let neighbors know what you can do and your price per job. Everyone can post a service.</p></div>
            </div>
            <form onSubmit={handleOfferSubmit} className="request-form-grid">
              <label>Service category
                <select required value={offerForm.category} onChange={(e) => updateOffer("category", e.target.value)}>
                  {SERVICE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label>Price per job (LKR)
                <input required type="number" min="0" step="0.01" value={offerForm.price} onChange={(e) => updateOffer("price", e.target.value)} placeholder="e.g. 2500" />
              </label>
              <label>Your area (optional)
                <input maxLength={120} value={offerForm.location} onChange={(e) => updateOffer("location", e.target.value)} placeholder="e.g. Colombo" />
              </label>
              <label>What’s included? (optional)
                <input maxLength={500} value={offerForm.description} onChange={(e) => updateOffer("description", e.target.value)} placeholder="Briefly describe your service" />
              </label>
              <div className="request-form-actions request-full-width">
                {offerError && <p role="alert" className="request-error">{offerError}</p>}
                {offerMessage && <p role="status" className="request-success">{offerMessage}</p>}
                {!getToken() && <p className="request-login-note">Please <Link to="/login">log in</Link> to share a service.</p>}
                <button disabled={offerBusy} className="request-submit">{offerBusy ? "Saving…" : "Publish my service"}</button>
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}

export default CreateRequest;
