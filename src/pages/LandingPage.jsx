import { Link, Navigate } from 'react-router-dom';
import { FiArrowRight, FiHeart, FiShield, FiMessageCircle, FiStar } from 'react-icons/fi';
import { HiOutlineHeart } from 'react-icons/hi2';
import { useSession } from '../context/SessionContext.jsx';

export default function LandingPage() {
  const { isAuthenticated, loading } = useSession();

  // If already signed in, go straight to the app
  if (!loading && isAuthenticated) {
    return <Navigate to="/discover" replace />;
  }

  return (
    <div className="landing">
      <header className="landing__nav">
        <Link to="/" className="landing__brand">
          <HiOutlineHeart className="landing__brand-icon" />
          <span>Heartly</span>
        </Link>

        <div className="landing__nav-actions">
          <Link to="/login" className="landing__signin">Sign in</Link>
          <Link to="/register" className="landing__signup">
            Get started
          </Link>
        </div>
      </header>

      <section className="landing__hero">
        <div className="landing__hero-copy">
          <p className="landing__eyebrow">
            <span className="landing__eyebrow-dot" /> Now in your city
          </p>

          <h1 className="landing__title">
            Real<br />
            <span className="landing__title-accent">Connections.</span><br />
            Real<br />
            <span className="landing__title-accent">Matches.</span>
          </h1>

          <p className="landing__sub">
            Heartly connects you with real people looking for something real.
            No endless swiping. No games. Just people.
          </p>

          <div className="landing__cta">
            <Link to="/register" className="landing__cta-primary">
              Meet your match <FiArrowRight />
            </Link>
            <Link to="/login" className="landing__cta-ghost">
              I have an account
            </Link>
          </div>

          <div className="landing__trust">
            <span>Join 10,000+ real people</span>
          </div>
        </div>

        <div className="landing__hero-art">
          <div className="landing__card landing__card--1">
            <span className="landing__card-avatar">S</span>
            <div>
              <p className="landing__card-name">Sophie, 27</p>
              <p className="landing__card-meta">Photographer · 2 km</p>
            </div>
          </div>
          <div className="landing__card landing__card--2">
            <span className="landing__card-avatar">M</span>
            <div>
              <p className="landing__card-name">Marcus, 31</p>
              <p className="landing__card-meta">Traveler · 4 km</p>
            </div>
          </div>
          <div className="landing__card landing__card--3">
            <span className="landing__card-avatar">P</span>
            <div>
              <p className="landing__card-name">Priya, 26</p>
              <p className="landing__card-meta">Designer · 6 km</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing__features">
        <h2 className="landing__section-title">Why Heartly</h2>

        <div className="landing__features-grid">
          <article className="landing__feature">
            <span className="landing__feature-icon"><FiHeart /></span>
            <h3>Real matches</h3>
            <p>We only show you people who actually match your preferences and shared interests.</p>
          </article>

          <article className="landing__feature">
            <span className="landing__feature-icon"><FiMessageCircle /></span>
            <h3>Meaningful chats</h3>
            <p>Start every conversation with a real prompt, not just &ldquo;hey.&rdquo;</p>
          </article>

          <article className="landing__feature">
            <span className="landing__feature-icon"><FiShield /></span>
            <h3>Safe & verified</h3>
            <p>Photo verification, 24/7 moderation, and easy blocking. Your safety comes first.</p>
          </article>

          <article className="landing__feature">
            <span className="landing__feature-icon"><FiStar /></span>
            <h3>Daily picks</h3>
            <p>Four hand-picked people each day. Thoughtful, not exhausting.</p>
          </article>
        </div>
      </section>

      <section className="landing__cta-band">
        <h2>Ready to meet someone real?</h2>
        <p>Create your free account in under a minute.</p>
        <Link to="/register" className="landing__cta-primary landing__cta-primary--lg">
          Start now <FiArrowRight />
        </Link>
      </section>

      <footer className="landing__footer">
        <span>&copy; {new Date().getFullYear()} Heartly. Made for real people looking for real love.</span>
      </footer>
    </div>
  );
}
