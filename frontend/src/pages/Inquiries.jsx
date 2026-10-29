import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, getToken } from "../services/api";

function InquiryCard({ inquiry, onRespond, onComplete, onRate, busy }) {
  const [rating, setRating] = useState("5");
  const [review, setReview] = useState("");
  const isProvider = inquiry.isProvider;
  const otherPerson = isProvider ? inquiry.requester : inquiry.provider;
  const offer = inquiry.offer;

  function submitRating(event) {
    event.preventDefault();
    onRate(inquiry._id, { rating: Number(rating), review });
  }

  return (
    <article className="inquiry-card">
      <div className="inquiry-card-heading">
        <div>
          <span className="service-offer-category">{offer?.category || "Service"}</span>
          {offer?.price !== undefined && <p className="inquiry-price">Price per job: LKR {Number(offer.price).toLocaleString("en-LK", { maximumFractionDigits: 2 })}</p>}
        </div>
        <span className={`inquiry-status ${inquiry.status}`}>{inquiry.status}</span>
      </div>
      <p className="inquiry-person">{isProvider ? "Inquiry from" : "Provider"}: {otherPerson?.name || "LocalHelp member"}{otherPerson?.username && <span> · @{otherPerson.username}</span>}</p>
      <p className="inquiry-message">{inquiry.message}</p>
      {inquiry.status === "pending" && isProvider && (
        <div className="inquiry-actions">
          <button disabled={busy} className="inquiry-button" onClick={() => onRespond(inquiry._id, "accepted")}>Accept</button>
          <button disabled={busy} className="inquiry-decline" onClick={() => onRespond(inquiry._id, "declined")}>Decline</button>
        </div>
      )}
      {inquiry.status === "pending" && !isProvider && <p className="inquiry-note">Waiting for the provider to respond. Your phone number stays private.</p>}
      {inquiry.status === "accepted" && isProvider && (
        <button disabled={busy} className="inquiry-button" onClick={() => onComplete(inquiry._id)}>
          {busy ? "Updating…" : "Mark service complete"}
        </button>
      )}
      {inquiry.status === "accepted" && !isProvider && <p className="inquiry-note">The provider accepted. Once they mark the service complete, you can rate them.</p>}
      {inquiry.status === "accepted" && inquiry.contactNumber && (
        <p className="inquiry-contact">Contact {isProvider ? "requester" : "provider"}: <a href={`tel:${inquiry.contactNumber}`}>{inquiry.contactNumber}</a></p>
      )}
      {inquiry.status === "completed" && inquiry.contactNumber && (
        <p className="inquiry-contact">Contact {isProvider ? "requester" : "provider"}: <a href={`tel:${inquiry.contactNumber}`}>{inquiry.contactNumber}</a></p>
      )}
      {inquiry.status === "completed" && inquiry.rating && (
        <div className="task-rating-summary">
          <strong>{isProvider ? "Customer rating" : "Your rating"}: {"★".repeat(inquiry.rating)}{"☆".repeat(5 - inquiry.rating)} ({inquiry.rating}/5)</strong>
          {inquiry.ratingReview && <p>{inquiry.ratingReview}</p>}
        </div>
      )}
      {inquiry.status === "completed" && !inquiry.rating && !isProvider && (
        <form className="task-rating-form" onSubmit={submitRating}>
          <h3>Rate this provider</h3>
          <p>Your review helps neighbors choose a trusted provider.</p>
          <label>Rating
            <select value={rating} onChange={(event) => setRating(event.target.value)}>
              <option value="5">5 stars - Excellent</option>
              <option value="4">4 stars - Great</option>
              <option value="3">3 stars - Good</option>
              <option value="2">2 stars - Fair</option>
              <option value="1">1 star - Poor</option>
            </select>
          </label>
          <label>Review (optional)
            <textarea maxLength={500} value={review} onChange={(event) => setReview(event.target.value)} placeholder="Share a few words about the service." />
          </label>
          <button disabled={busy} className="task-rating-submit">{busy ? "Saving…" : "Submit rating"}</button>
        </form>
      )}
      {inquiry.status === "completed" && !inquiry.rating && isProvider && <p className="inquiry-note">The service is complete. Waiting for the customer’s rating.</p>}
      {inquiry.status === "declined" && !isProvider && <p className="inquiry-note">The provider declined this inquiry.</p>}
    </article>
  );
}

function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  async function loadInquiries() {
    setLoading(true);
    try {
      const data = await apiRequest("/offers/inquiries");
      setInquiries(data.inquiries || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) return undefined;
    let current = true;
    apiRequest("/offers/inquiries")
      .then((data) => {
        if (current) {
          setInquiries(data.inquiries || []);
          setError("");
        }
      })
      .catch((requestError) => {
        if (current) setError(requestError.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, []);

  async function updateInquiry(inquiryId, path, body, successMessage) {
    setBusyId(inquiryId);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(path, {
        method: "PATCH",
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setNotice(successMessage || result.message);
      await loadInquiries();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  function respond(inquiryId, status) {
    updateInquiry(inquiryId, `/offers/inquiries/${inquiryId}`, { status });
  }

  function complete(inquiryId) {
    updateInquiry(inquiryId, `/offers/inquiries/${inquiryId}/complete`, null);
  }

  function rate(inquiryId, ratingData) {
    updateInquiry(inquiryId, `/offers/inquiries/${inquiryId}/rating`, ratingData);
  }

  if (!getToken()) {
    return <main className="inquiries-page"><section className="inquiries-container"><h1 className="request-heading">Your inquiries</h1><p className="request-intro">Please <Link to="/login">log in</Link> to view service inquiries.</p></section></main>;
  }

  const received = inquiries.filter((inquiry) => inquiry.isProvider);
  const sent = inquiries.filter((inquiry) => !inquiry.isProvider);

  return (
    <main className="inquiries-page">
      <div className="inquiries-container">
        <p className="section-kicker">Stay connected with your community</p>
        <h1 className="request-heading">Your inquiries</h1>
        <p className="request-intro">Accept an inquiry to share contact numbers. After the service is complete, the customer can rate the provider.</p>
        {notice && <p className="request-success" role="status">{notice}</p>}
        {error && <p className="request-error" role="alert">{error}</p>}
        {loading && <p className="mt-6 text-gray-600">Loading inquiries…</p>}
        {!loading && !error && inquiries.length === 0 && <div className="inquiry-empty">No inquiries yet. Contact a provider from the Local providers tab to start a conversation.</div>}

        {!loading && (
          <div className="inquiry-columns">
            <section>
              <h2>Received</h2>
              {received.length ? received.map((inquiry) => <InquiryCard key={inquiry._id} inquiry={inquiry} onRespond={respond} onComplete={complete} onRate={rate} busy={busyId === inquiry._id} />) : <p className="inquiry-empty small">No received inquiries yet.</p>}
            </section>
            <section>
              <h2>Sent</h2>
              {sent.length ? sent.map((inquiry) => <InquiryCard key={inquiry._id} inquiry={inquiry} onRespond={respond} onComplete={complete} onRate={rate} busy={busyId === inquiry._id} />) : <p className="inquiry-empty small">No sent inquiries yet.</p>}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

export default Inquiries;
