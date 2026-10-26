import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, getToken } from "../services/api";

function ServiceOfferCard({ offer, inquiry }) {
  const price = Number(offer.price).toLocaleString("en-LK", { maximumFractionDigits: 2 });
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const inquiryStatus = sent ? "pending" : inquiry?.status;

  async function sendInquiry() {
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/offers/${offer._id}/inquiries`, {
        method: "POST",
        body: JSON.stringify({ message: `I'm interested in your ${offer.category.toLowerCase()} service. Please contact me if you are available.` }),
      });
      setSent(true);
    } catch (requestError) {
      setError(requestError.message === "Request failed"
        ? "Could not send the inquiry. Restart the backend and try again."
        : requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="service-offer-card">
      <div className="service-offer-topline">
        <span className="service-offer-category">{offer.category}</span>
        <strong className="service-offer-price">LKR {price}</strong>
      </div>
      <p className="service-offer-provider">Offered by {offer.provider?.name || "Local provider"}</p>
      {offer.provider?.reputationCount > 0 && <p className="service-offer-rating">★ {Number(offer.provider.reputation).toFixed(1)} · {offer.provider.reputationCount} review{offer.provider.reputationCount === 1 ? "" : "s"}</p>}
      {offer.location && <p className="service-offer-location">{offer.location}</p>}
      {offer.description && <p className="service-offer-description">{offer.description}</p>}
      <div className="service-offer-contact">
        {inquiryStatus === "pending" ? (
          <><span className="inquiry-status pending">Request sent</span><Link className="inquiry-card-link" to="/inquiries">View inquiry</Link></>
        ) : inquiryStatus === "accepted" ? (
          <><span className="inquiry-status accepted">Accepted</span><Link className="inquiry-card-link" to="/inquiries">View contact</Link></>
        ) : (
          <>
            {inquiryStatus === "declined" && <span className="inquiry-status declined">Declined</span>}
            {getToken() ? (
              <button type="button" className="inquiry-button" disabled={busy} onClick={sendInquiry}>
                {busy ? "Sending…" : inquiryStatus === "declined" ? "Contact provider again" : "Contact provider"}
              </button>
            ) : (
              <Link className="inquiry-button" to="/login">Log in to contact</Link>
            )}
          </>
        )}
      </div>
      {error && <p className="inquiry-error" role="alert">{error}</p>}
    </article>
  );
}

export default ServiceOfferCard;
