import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FiChevronLeft, FiX, FiStar, FiAlertCircle } from 'react-icons/fi';
import { FaHeart, FaUndo, FaCheckCircle } from 'react-icons/fa';
import { HiOutlineHeart } from 'react-icons/hi2';
import { discoveryApi } from '../api/discovery.js';
import { matchApi, safetyApi } from '../api/matches.js';

export default function SwipePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const userId = params.get('userId');

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(null);
  const [actionError, setActionError] = useState('');
  const [blocked, setBlocked] = useState(false);

  /* Fetch the profile */
  useEffect(() => {
    if (!userId) {
      setError('No profile selected');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');

    discoveryApi
      .byUserId(userId)
      .then((r) => {
        if (cancelled) return;
        setItem(r.item);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || 'Could not load profile');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId]);

  const profile = item?.profile ?? {};
  const age = ageOf(profile.birthdate);
  const primaryPhoto =
    (profile.photos ?? []).find((p) => p.isPrimary) ??
    (profile.photos ?? [])[0];
  const photo = primaryPhoto?.url ?? placeholderImage(profile.name);

  /* Action helpers */
  const animate = (direction) => {
    setLeaving(direction);
    setTimeout(() => setLeaving(null), 300);
  };

  const onSkip = async () => {
    if (!userId) return;
    setActionError('');
    animate('left');
    try {
      await matchApi.pass(userId);
      navigate('/discover', { replace: true });
    } catch (e) {
      setActionError(e.message || 'Could not skip');
    }
  };

  const onLike = async () => {
    if (!userId) return;
    setActionError('');
    animate('right');
    try {
      const result = await matchApi.like(userId);
      if (result?.matched && result?.match?.id) {
        navigate(`/match/${result.match.id}`, { replace: true });
      } else {
        navigate('/discover', { replace: true });
      }
    } catch (e) {
      setActionError(e.message || 'Could not like');
    }
  };

  const onSuperLike = async () => {
    if (!userId) return;
    setActionError('');
    animate('up');
    try {
      const result = await matchApi.superLike(userId);
      if (result?.matched && result?.match?.id) {
        navigate(`/match/${result.match.id}`, { replace: true });
      } else {
        navigate('/discover', { replace: true });
      }
    } catch (e) {
      setActionError(e.message || 'Could not super like');
    }
  };

  const onBlock = async () => {
    if (!userId) return;
    if (!confirm(`Block ${profile.name || 'this person'}?`)) return;
    try {
      await safetyApi.block(userId);
      setBlocked(true);
      navigate('/discover', { replace: true });
    } catch (e) {
      setActionError(e.message || 'Could not block');
    }
  };

  /* -------- UI states -------- */

  if (loading) {
    return (
      <div className="swipe-full">
        <SwipeTop onBack={() => navigate(-1)} />
        <div className="swipe-full__stage">
          <div className="swipe-full__card swipe-full__card--skeleton" />
        </div>
        <div className="swipe-full__actions">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="swipe-full__btn-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="swipe-full">
        <SwipeTop onBack={() => navigate(-1)} />
        <div className="swipe-full__error">
          <FiAlertCircle />
          <h3>Profile unavailable</h3>
          <p>{error || 'This profile could not be loaded.'}</p>
          <Link to="/discover" className="swipe-full__error-cta">
            Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="swipe-full">
      <SwipeTop onBack={() => navigate(-1)} onBlock={onBlock} />

      <div className="swipe-full__stage">
        <div
          className={`swipe-full__card ${
            leaving ? `is-leaving-${leaving}` : ''
          }`}
        >
          <img src={photo} alt={profile.name || ''} />

          <div className="swipe-full__overlay" />

          <div className="swipe-full__info">
            <h2 className="swipe-full__name">
              {profile.name || 'Anonymous'}
              {age != null && `, ${age}`}
              {profile.verified && (
                <FaCheckCircle
                  className="swipe-full__verified"
                  aria-hidden="true"
                />
              )}
            </h2>

            {profile.interests?.length > 0 && (
              <p className="swipe-full__tags">
                {profile.interests.slice(0, 3).join(' · ')}
              </p>
            )}

            {profile.location && (
              <p className="swipe-full__location">
                <PinIcon />{' '}
                {formatLocation(profile.location)}
              </p>
            )}
          </div>
        </div>
      </div>

      {actionError && (
        <p className="swipe-full__action-error" role="alert">
          {actionError}
        </p>
      )}

      <div className="swipe-full__actions">
        <button
          type="button"
          className="swipe-full__btn swipe-full__btn--undo"
          aria-label="Undo"
          onClick={() => navigate(-1)}
        >
          <FaUndo />
        </button>

        <button
          type="button"
          className="swipe-full__btn swipe-full__btn--skip"
          aria-label="Skip"
          onClick={onSkip}
        >
          <FiX />
        </button>

        <button
          type="button"
          className="swipe-full__btn swipe-full__btn--like"
          aria-label="Like"
          onClick={onLike}
        >
          <FaHeart />
        </button>

        <button
          type="button"
          className="swipe-full__btn swipe-full__btn--star"
          aria-label="Super like"
          onClick={onSuperLike}
        >
          <FiStar />
        </button>
      </div>
    </div>
  );
}

/* ---------- Top bar ---------- */
function SwipeTop({ onBack, onBlock }) {
  return (
    <header className="swipe-full__top">
      <button
        type="button"
        className="swipe-full__back"
        aria-label="Back"
        onClick={onBack}
      >
        <FiChevronLeft />
      </button>

      <Link to="/discover" className="swipe-full__brand">
        <HiOutlineHeart className="swipe-full__brand-icon" />
        <span>Heartly</span>
      </Link>

      {onBlock ? (
        <button
          type="button"
          className="swipe-full__more"
          aria-label="More options"
          onClick={onBlock}
        >
          <MoreDots />
        </button>
      ) : (
        <span className="swipe-full__spacer" aria-hidden="true" />
      )}
    </header>
  );
}

/* ---------- Helpers ---------- */
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

function formatLocation(loc) {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  if (loc.lat != null && loc.lng != null) {
    return `${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)}`;
  }
  return '';
}

function placeholderImage(name = '') {
  const initials =
    name
      .split(' ')
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FFE5EA"/>
          <stop offset="1" stop-color="#FFB7C3"/>
        </linearGradient>
      </defs>
      <rect width="800" height="1100" fill="url(#g)"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
            fill="#E62E4E" font-family="Inter, sans-serif" font-weight="800"
            font-size="220">${initials}</text>
    </svg>`.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function PinIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline', verticalAlign: '-1px' }}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function MoreDots() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}
