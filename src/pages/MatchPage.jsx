import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiX, FiMessageCircle } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { matchApi } from '../api/matches.js';
import { useSession } from '../context/SessionContext.jsx';

export default function MatchPage() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const { user } = useSession();

  const [match, setMatch] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    matchApi
      .detail(matchId)
      .then((r) => {
        if (cancelled) return;
        setMatch(r.match);
        setOtherProfile(r.otherProfile);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || 'Could not load match');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [matchId]);

  const myInitials = (user?.name || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const theirInitials = (otherProfile?.name || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const theirPhoto =
    (otherProfile?.photos ?? []).find((p) => p.isPrimary) ??
    (otherProfile?.photos ?? [])[0];

  const theirImage = theirPhoto?.url ?? placeholder(theirInitials);

  if (loading) {
    return (
      <section className="match-page">
        <button
          type="button"
          className="match-page__close"
          aria-label="Close"
          onClick={() => navigate('/discover', { replace: true })}
        >
          <FiX />
        </button>
        <div className="match-page__loading">
          <span className="match-page__spinner" />
        </div>
      </section>
    );
  }

  if (error || !match) {
    return (
      <section className="match-page">
        <button
          type="button"
          className="match-page__close"
          aria-label="Close"
          onClick={() => navigate('/discover', { replace: true })}
        >
          <FiX />
        </button>
        <div className="match-page__content">
          <h1 className="match-page__title">Match unavailable</h1>
          <p className="match-page__sub">{error || 'This match could not be loaded.'}</p>
          <button
            type="button"
            className="match-page__btn match-page__btn--ghost"
            onClick={() => navigate('/discover', { replace: true })}
          >
            <FiX /> <span>Back to Discover</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="match-page">
      <button
        type="button"
        className="match-page__close"
        aria-label="Close"
        onClick={() => navigate('/discover', { replace: true })}
      >
        <FiX />
      </button>

      <div className="match-page__content">
        <div className="match-page__headline">
          <FaHeart className="match-page__headline-heart" aria-hidden="true" />
          <h1 className="match-page__title">It&apos;s a Match!</h1>
        </div>

        <p className="match-page__sub">
          You and {otherProfile?.name?.split(' ')[0] || 'someone'} liked each other.
        </p>

        <div className="match-page__avatars">
          <div className="match-page__avatar match-page__avatar--left">
            <span className="match-page__avatar-fallback">{myInitials}</span>
          </div>

          <span className="match-page__avatar-heart" aria-hidden="true">
            <FaHeart />
          </span>

          <div className="match-page__avatar match-page__avatar--right">
            <img src={theirImage} alt="" />
          </div>
        </div>

        <div className="match-page__actions">
          <button
            type="button"
            className="match-page__btn match-page__btn--primary"
            onClick={() => navigate(`/chat/${matchId}`, { replace: true })}
          >
            <FiMessageCircle />
            <span>Send a Message</span>
          </button>

          <button
            type="button"
            className="match-page__btn match-page__btn--ghost"
            onClick={() => navigate('/discover', { replace: true })}
          >
            <FiX />
            <span>Keep Swiping</span>
          </button>
        </div>
      </div>

      {/* Decorative floating hearts */}
      <span className="match-page__float match-page__float--1" aria-hidden="true"><FaHeart /></span>
      <span className="match-page__float match-page__float--2" aria-hidden="true"><FaHeart /></span>
      <span className="match-page__float match-page__float--3" aria-hidden="true"><FaHeart /></span>
      <span className="match-page__float match-page__float--4" aria-hidden="true"><FaHeart /></span>
      <span className="match-page__float match-page__float--5" aria-hidden="true"><FaHeart /></span>
    </section>
  );
}

function placeholder(initials) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FFE5EA"/>
          <stop offset="1" stop-color="#FFB7C3"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#g)"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
            fill="#E62E4E" font-family="Inter, sans-serif" font-weight="800"
            font-size="80">${initials}</text>
    </svg>`.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
