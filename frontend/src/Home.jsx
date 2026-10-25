import { Link } from "react-router-dom";

function Home() {
  const categories = [
    ["🧹", "Cleaning", "/tasks?category=Cleaning"],
    ["📦", "Moving", "/tasks?category=Moving"],
    ["📚", "Tutoring", "/tasks?category=Tutoring"],
    ["🛠️", "Plumbing", "/tasks?category=Plumbing"],
  ];

  return (
    <div className="home-shell min-h-screen">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow"><span aria-hidden="true">✦</span> Your smart local service hub</span>
          <h1 className="hero-title">Local services.<br /><span>Made simple.</span></h1>
          <p className="hero-description">
            Find trusted help nearby, compare service prices, or share your skills with your community—all in one place.
          </p>
          <div className="hero-actions">
            <Link to="/services" className="hero-primary">Explore services <span aria-hidden="true">→</span></Link>
            <Link to="/create-request" className="hero-secondary">Post a request <span aria-hidden="true">＋</span></Link>
          </div>
        </div>

        <div className="hero-art" aria-label="Local service finder preview">
          <div className="art-disc" />
          <div className="art-card">
            <div className="finder-heading"><span className="finder-symbol" aria-hidden="true">⌕</span><span>Service finder</span><span className="finder-dot" /></div>
            <div className="finder-field"><span className="finder-field-icon" aria-hidden="true">✦</span><span>What do you need?</span><span className="finder-arrow" aria-hidden="true">→</span></div>
            <div className="finder-categories"><span>Cleaning</span><span>Moving</span><span>More</span></div>
            <span className="art-caption">Help around the corner</span>
          </div>
          <div className="floating-tag one"><span className="tag-spark" aria-hidden="true">✦</span> Clear local prices</div>
          <div className="floating-tag two"><span className="tag-check" aria-hidden="true">✓</span> Simple task tracking</div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-heading">
          <div><p className="section-kicker">Find your next solution</p><h2 className="section-heading">Browse by service</h2></div>
          <Link to="/services" className="section-link">See all services <span aria-hidden="true">→</span></Link>
        </div>
        <div className="category-tiles">
          {categories.map(([icon, name, href]) => (
            <Link className="category-tile" to={href} key={name}>
              <span className="category-icon" aria-hidden="true">{icon}</span>
              <span>{name}<span className="ml-2 text-sm" aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-value-row">
        <div className="value-item"><span className="value-icon">01</span><div><h3>Find the right service</h3><p>Browse local offers and compare prices.</p></div></div>
        <div className="value-item"><span className="value-icon">02</span><div><h3>Post what you need</h3><p>Share a request with useful details.</p></div></div>
        <div className="value-item"><span className="value-icon">03</span><div><h3>Help your community</h3><p>Offer your skills and manage your tasks.</p></div></div>
      </section>
    </div>
  );
}

export default Home;
