import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiChevronLeft, FiHeart, FiX, FiStar, FiAlertCircle } from 'react-icons/fi';
import { FaCheckCircle } from 'react-icons/fa';
import { discoveryApi } from '../api/discovery.js';
import { matchApi, safetyApi } from '../api/matches.js';

export default function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    discoveryApi
      .byUserId(userId)
      .then((r) => { if (!cancelled) setItem(r.item); })
      .catch((e) => { if (!cancelled) setError(e.message || 'Could not load profile'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [userId]);

  const onLike = async () => {
    if (!userId) return;
    setActing(true);
    try {
      const r = await matchApi.like(userId);
      if (r?.matched && r?.match?.id) navigate(`/match/${r.match.id}`, { replace: true });
      else navigate(-1);
    } catch (e) {
      alert(e.message || 'Could not like');
    } finally {
      setActing(false);
    }
  };

  const onPass = async () => {
    if (!userId) return;
    setActing(true);
    try {
      await matchApi.pass(userId);
      navigate(-1);
    } catch (e) {
      alert(e.message || 'Could not pass');
    } finally {
      setActing(false);
    }
  };

  const onBlock = async () => {
    if (!userId) return;
    if (!confirm('Block this user? They will disappear from your feed.')) return;
    try {
      await safetyApi.block(userId);
      navigate('/discover', { replace: true });
    } catch (e) {
      alert(e.message || 'Could not block');
    }
  };

  const p = item?.profile ?? {};
  const photos = p.photos ?? [];
  const primary = photos.find((x) => x.isPrimary) ?? photos[0];
  const heroImage = primary?.url ?? placeholder(p.name);

  const age = ageOf(p.birthdate);

  if (loading) {
    return (
      <section className="public-profile">
        <PublicTop onBack={() => navigate(-1)} />
        <div className="public-profile__hero public-profile__hero--skeleton" />
      </section>
    );
  }

  if (error || !item) {
    return (
      <section className="public-profile">
        <PublicTop onBack={() => navigate(-1)} />
        <div className="public-profile__error">
          <FiAlertCircle />
          <h3>Profile unavailable</h3>
          <p>{error || 'This profile could not be loaded.'}</p>
          <Link to="/discover" className="public-profile__error-cta">Back to Discover</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="public-profile">
      <PublicTop onBack={() => navigate(-1)} onBlock={onBlock} />

      <div className="public-profile__hero">
        <img src={heroImage} alt="" />
        <div className="public-profile__overlay" />

        <div className="public-profile__hero-info">
          <h1 className="public-profile__name">
            {p.name || 'Anonymous'}
            {age != null && `, ${age}`}
            {p.verified && <FaCheckCircle className="public-profile__verified" />}
          </h1>

          {p.location && (
            <p className="public-profile__location">
              <PinIcon /> {p.location.lat?.toFixed(2)}, {p.location.lng?.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {photos.length > 1 && (
        <div className="public-profile__gallery">
          {photos.map((ph, i) => (
            <div key={ph.id} className="public-profile__gallery-item">
              <img src={ph.url} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      <div className="public-profile__body">
        {p.bio && (
          <section className="public-profile__section">
            <h2 className="public-profile__section-title">About me</h2>
            <p className="public-profile__bio">{p.bio}</p>
          </section>
        )}

        {p.interests?.length > 0 && (
          <section className="public-profile__section">
            <h2 className="public-profile__section-title">Interests</h2>
            <div className="public-profile__tags">
              {p.interests.map((tag) => (
                <span key={tag} className="public-profile__tag">{tag}</span>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="public-profile__actions">
        <button
          type="button"
          className="public-profile__btn public-profile__btn--skip"
          onClick={onPass}
          disabled={acting}
          aria-label="Pass"
        >
          <FiX />
        </button>

        <button
          type="button"
          className="public-profile__btn public-profile__btn--like"
          onClick={onLike}
          disabled={acting}
          aria-label="Like"
        >
          <FiHeart />
        </button>

        <button
          type="button"
          className="public-profile__btn public-profile__btn--star"
          onClick={onLike}
          disabled={acting}
          aria-label="Super like"
        >
          <FiStar />
        </button>
      </div>
    </section>
  );
}

function PublicTop({ onBack, onBlock }) {
  return (
    <header className="public-profile__top">
      <button type="button" className="public-profile__back" aria-label="Back" onClick={onBack}>
        <FiChevronLeft />
      </button>
      <span className="public-profile__brand">Heartly</span>
      {onBlock ? (
        <button type="button" className="public-profile__more" aria-label="Block user" onClick={onBlock}>
          ⋮
        </button>
      ) : (
        <span className="public-profile__spacer" />
      )}
    </header>
  );
}

function ageOf(birthdate) {
  if (!birthdate) return null;
  const ms = typeof birthdate === 'bigint' ? Number(birthdate) : Number(birthdate);
  if (!ms) return null;
  const d = new Date(ms);
  const n = new Date();
  let age = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) age--;
  return age;
}

function placeholder(name = '') {
  const initials = name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase() || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE5EA"/><stop offset="1" stop-color="#FFB7C3"/></linearGradient></defs><rect width="800" height="1100" fill="url(#g)"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#E62E4E" font-family="Inter, sans-serif" font-weight="800" font-size="220">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: '-1px' }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
