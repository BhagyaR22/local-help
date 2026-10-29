import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiRequest, clearSession, getToken } from "../services/api";

function MessageIcon() {
  return (
    <svg className="nav-message-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
    </svg>
  );
}

function NavItem({ to, label, count }) {
  return (
    <Link className="nav-link nav-item-link" to={to} aria-label={count ? `${label}, ${count} item${count === 1 ? "" : "s"}` : label}>
      <span className="nav-item-label">{label}</span>
      <span className="nav-message-wrap">
        <MessageIcon />
        {count > 0 && <span className="nav-count" aria-hidden="true">{count > 99 ? "99+" : count}</span>}
      </span>
    </Link>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = Boolean(getToken());
  const [activityCount, setActivityCount] = useState(0);
  const [inquiryCount, setInquiryCount] = useState(0);

  useEffect(() => {
    if (!loggedIn) {
      setActivityCount(0);
      setInquiryCount(0);
      return undefined;
    }

    let current = true;
    async function refreshCounts() {
      const [activityResult, inquiryResult] = await Promise.allSettled([
        apiRequest("/tasks/mine?page=1&limit=50"),
        apiRequest("/offers/inquiries"),
      ]);
      if (!current) return;
      if (activityResult.status === "fulfilled") {
        setActivityCount(activityResult.value.activeItems ?? activityResult.value.tasks?.filter((task) => task.status !== "completed").length ?? 0);
      }
      if (inquiryResult.status === "fulfilled") {
        setInquiryCount(inquiryResult.value.inquiries?.filter((inquiry) => inquiry.status !== "completed").length ?? 0);
      }
    }

    refreshCounts();
    const timer = window.setInterval(refreshCounts, 30000);
    return () => {
      current = false;
      window.clearInterval(timer);
    };
  }, [loggedIn, location.pathname]);

  function logout() {
    clearSession();
    setActivityCount(0);
    setInquiryCount(0);
    navigate("/");
  }

  return (
    <nav className="site-nav" aria-label="Main navigation">
      <div className="nav-container">
        <Link to="/" className="brand-link" aria-label="LocalHelp home">
          <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg></span>
          <span className="brand-name">Local<span>Help</span></span>
        </Link>
        <div className="nav-menu">
          <Link className="nav-link" to="/services">Find services</Link>
          <Link className="nav-link" to="/create-request">Request a service</Link>
        </div>
        <div className="nav-account">
          {loggedIn ? (
            <>
              <NavItem to="/my-tasks" label="My activity" count={activityCount} />
              <NavItem to="/inquiries" label="Inquiries" count={inquiryCount} />
              <Link className="nav-link" to="/profile">Profile</Link>
              <button type="button" onClick={logout} className="nav-link nav-logout">Log out</button>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">Log in</Link>
              <Link className="nav-cta" to="/register">Get started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
