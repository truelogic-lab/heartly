import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineHeart } from 'react-icons/hi2';
import { useSession } from '../context/SessionContext.jsx';

export default function SplashPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSession();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Wait for session restore
    if (loading) return;

    // Give the splash ~1.4s of screen time, then route
    const t = setTimeout(() => {
      navigate(isAuthenticated ? '/discover' : '/login', { replace: true });
    }, 1400);

    return () => clearTimeout(t);
  }, [loading, isAuthenticated, navigate]);

  const skip = () => {
    if (loading) return;
    navigate(isAuthenticated ? '/discover' : '/login', { replace: true });
  };

  return (
    <section
      className={`splash ${visible ? 'is-visible' : ''}`}
      onClick={skip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') skip();
      }}
      aria-label="Heartly"
    >
      <div className="splash__logo">
        <HiOutlineHeart className="splash__heart" />
      </div>
      <h1 className="splash__brand">Heartly</h1>
      <p className="splash__tagline">Real connections. Real matches.</p>
    </section>
  );
}
