import { Link, useNavigate } from "react-router-dom";
import { clearSession, getToken } from "../services/api";

function Navbar() {
  const navigate = useNavigate();
  const loggedIn = Boolean(getToken());

  function logout() {
    clearSession();
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
              <Link className="nav-link" to="/my-tasks">My activity</Link>
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


