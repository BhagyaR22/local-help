import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import heroPhoto from "../assets/localhelp-hero.png";
import { CATEGORY_ICONS, SERVICE_CATEGORIES } from "../data/serviceCategories";

function Home() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const categories = SERVICE_CATEGORIES.slice(0, 8);

  function findHelp(event) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/services?search=${encodeURIComponent(query)}` : "/services");
  }

  return (
    <div className="home-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.2"/></svg>Trusted help, right in your neighborhood</span>
          <h1 className="hero-title">Local help for your<br /><span>everyday tasks.</span></h1>
          <p className="hero-description">Connect with people nearby who can help with the things on your list. From quick repairs to weekly cleaning, get the help you need—without the hassle.</p>
          <form className="hero-search" onSubmit={findHelp} role="search">
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4 4"/></svg>
            <input aria-label="Search for a service" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="What do you need help with?" />
            <button type="submit">Find help</button>
          </form>
          <div className="hero-benefits" aria-label="LocalHelp benefits">
            <span><i aria-hidden="true">✓</i> Easy requests</span>
            <span><i aria-hidden="true">✓</i> Local community</span>
            <span><i aria-hidden="true">✓</i> Simple task tracking</span>
          </div>
          <Link to="/create-request" className="hero-request-link">Need a hand? Request a service <span aria-hidden="true">→</span></Link>
        </div>

        <div className="hero-art">
          <div className="hero-photo-frame">
            <img src={heroPhoto} alt="A local home repair professional installing a kitchen shelf" />
          </div>
          <div className="hero-floating-card hero-floating-top">
            <span className="floating-pin" aria-hidden="true">⌖</span>
            <span><strong>Help close to home</strong><small>Find open community requests</small></span>
          </div>
          <div className="hero-floating-card hero-floating-bottom">
            <span className="floating-check" aria-hidden="true">✓</span>
            <span><strong>One helpful community</strong><small>Post a request or offer help</small></span>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-heading">
          <div><p className="section-kicker">A little help goes a long way</p><h2 className="section-heading">Find help for everyday jobs</h2></div>
          <Link to="/services" className="section-link">See who needs help <span aria-hidden="true">→</span></Link>
        </div>
        <div className="category-tiles">
          {categories.map((name) => (
            <Link className="category-tile" to={`/services?category=${encodeURIComponent(name)}`} key={name}>
              <span className="category-icon" aria-hidden="true">{CATEGORY_ICONS[name]}</span>
              <span>{name}<span className="category-arrow" aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}

export default Home;
