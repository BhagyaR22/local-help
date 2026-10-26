import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, getToken } from "../services/api";

function InquiryCard({ inquiry, onRespond, busy }) {
  const isProvider = inquiry.isProvider;
  const otherPerson = isProvider ? inquiry.requester : inquiry.provider;
  const offer = inquiry.offer;

  return (
    <article className="inquiry-card">
      <div className="inquiry-card-heading">
        <div>
          <span className="service-offer-category">{offer?.category || "Service"}</span>
          {offer?.price !== undefined && <p className="inquiry-price">LKR {Number(offer.price).toLocaleString("en-LK", { maximumFractionDigits: 2 })}</p>}
        </div>
        <span className={`inquiry-status ${inquiry.status}`}>{inquiry.status}</span>
      </div>
      <p className="inquiry-person">{isProvider ? "Inquiry from" : "Provider"}: {otherPerson?.name || "LocalHelp member"}</p>
      <p className="inquiry-message">{inquiry.message}</p>
      {inquiry.status === "pending" && isProvider && (
        <div className="inquiry-actions">
          <button disabled={busy} className="inquiry-button" onClick={() => onRespond(inquiry._id, "accepted")}>Accept</button>
          <button disabled={busy} className="inquiry-decline" onClick={() => onRespond(inquiry._id, "declined")}>Decline</button>
        </div>
      )}
      {inquiry.status === "pending" && !isProvider && <p className="inquiry-note">Waiting for the provider to respond. Your phone number stays private.</p>}
      {inquiry.status === "accepted" && inquiry.contactNumber && (
        <p className="inquiry-contact">Contact {isProvider ? "requester" : "provider"}: <a href={`tel:${inquiry.contactNumber}`}>{inquiry.contactNumber}</a></p>
      )}
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

  async function respond(inquiryId, status) {
    setBusyId(inquiryId);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(`/offers/inquiries/${inquiryId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setNotice(result.message);
      await loadInquiries();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
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
        <p className="request-intro">Accept an inquiry to share contact numbers. Numbers stay private while an inquiry is pending.</p>
        {notice && <p className="request-success" role="status">{notice}</p>}
        {error && <p className="request-error" role="alert">{error}</p>}
        {loading && <p className="mt-6 text-gray-600">Loading inquiries…</p>}
        {!loading && !error && inquiries.length === 0 && <div className="inquiry-empty">No inquiries yet. Contact a provider from the Service prices tab to start a conversation.</div>}

        {!loading && (
          <div className="inquiry-columns">
            <section>
              <h2>Received</h2>
              {received.length ? received.map((inquiry) => <InquiryCard key={inquiry._id} inquiry={inquiry} onRespond={respond} busy={busyId === inquiry._id} />) : <p className="inquiry-empty small">No received inquiries yet.</p>}
            </section>
            <section>
              <h2>Sent</h2>
              {sent.length ? sent.map((inquiry) => <InquiryCard key={inquiry._id} inquiry={inquiry} onRespond={respond} busy={busyId === inquiry._id} />) : <p className="inquiry-empty small">No sent inquiries yet.</p>}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

export default Inquiries;
