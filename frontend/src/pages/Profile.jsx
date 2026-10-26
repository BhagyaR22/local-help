import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, clearSession, getToken } from "../services/api";

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      return;
    }

    apiRequest("/users/me")
      .then((data) => setUser(data.user))
      .catch((err) => setError(err.message));
  }, []);

  function logout() {
    clearSession();
    window.location.href = "/";
  }

  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.name || "LocalHelp member";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  if (!getToken()) {
    return <main className="profile-page"><section className="profile-container"><h1 className="profile-title">Your profile</h1><p className="profile-subtitle">Please <Link to="/login">log in</Link> to view your account.</p></section></main>;
  }

  if (error) {
    return <main className="profile-page"><section className="profile-container"><h1 className="profile-title">Your profile</h1><p role="alert" className="profile-error">{error}</p><Link className="profile-action-link" to="/login">Go to login</Link></section></main>;
  }

  if (!user) return <main className="profile-page"><div className="profile-container profile-loading">Loading your profile…</div></main>;

  return (
    <main className="profile-page">
      <div className="profile-container">
        <p className="section-kicker">Your LocalHelp account</p>
        <h1 className="profile-title">My profile</h1>
        <p className="profile-subtitle">Manage your details and see how you appear in the community.</p>

        <section className="profile-card" aria-label="Profile information">
          <div className="profile-banner">
            <div className="profile-avatar" aria-label={`Initials: ${initials}`}>{initials}</div>
            <div className="profile-identity">
              <span className="profile-member-label">Community member</span>
              <h2>{displayName}</h2>
              <p>{user.username ? `@${user.username}` : "Username not set"}</p>
            </div>
            <div className="profile-reputation">
              <span className="profile-star" aria-hidden="true">★</span>
              <span><strong>{user.reputationCount ? Number(user.reputation).toFixed(1) : "—"}</strong><small>{user.reputationCount || 0} reviews</small></span>
            </div>
          </div>

          <div className="profile-details">
            <h3>Account details</h3>
            <div className="profile-detail-grid">
              <div className="profile-detail">
                <span className="profile-detail-icon" aria-hidden="true">✉</span>
                <span><small>Email address</small><strong>{user.email}</strong></span>
              </div>
              <div className="profile-detail">
                <span className="profile-detail-icon" aria-hidden="true">☎</span>
                <span><small>Contact number</small><strong>{user.contactNumber || "Not set"}</strong></span>
              </div>
              <div className="profile-detail">
                <span className="profile-detail-icon" aria-hidden="true">⌂</span>
                <span><small>Username</small><strong>{user.username ? `@${user.username}` : "Not set"}</strong></span>
              </div>
              <div className="profile-detail">
                <span className="profile-detail-icon" aria-hidden="true">🤝</span>
                <span><small>Community reputation</small><strong>{user.reputationCount ? `${Number(user.reputation).toFixed(1)} / 5 from ${user.reputationCount} review${user.reputationCount === 1 ? "" : "s"}` : "No reviews yet"}</strong></span>
              </div>
            </div>
          </div>

          <div className="profile-card-footer">
            <p>Your contact number is shared only when a service connection is accepted.</p>
            <button type="button" onClick={logout} className="profile-logout">Log out</button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Profile;


