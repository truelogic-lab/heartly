import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiX, FiCheck, FiHeart } from 'react-icons/fi';
import { FaCheckCircle } from 'react-icons/fa';
import { matchApi } from '../api/matches.js';

export default function RequestsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    matchApi
      .likesReceived()
      .then((r) => setItems(r?.items ?? []))
      .catch((e) => setError(e.message || 'Could not load requests'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const approve = async (userId) => {
    setActing(userId);
    try {
      const result = await matchApi.like(userId);
      // Remove from list
      setItems((list) => list.filter((it) => it.profile?.userId !== userId));
      if (result?.matched && result?.match?.id) {
        navigate(`/match/${result.match.id}`);
      }
    } catch (e) {
      alert(e.message || 'Could not approve');
    } finally {
      setActing(null);
    }
  };

  const decline = async (userId) => {
    setActing(userId);
    try {
      await matchApi.pass(userId);
      setItems((list) => list.filter((it) => it.profile?.userId !== userId));
    } catch (e) {
      alert(e.message || 'Could not decline');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="requests-page">
      <header className="requests__top">
        <button
          type="button"
          className="requests__back"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <FiChevronLeft />
        </button>
        <h1 className="requests__title">Requests</h1>
        <span className="requests__spacer" />
      </header>

      {loading && (
        <ul className="requests__skeleton">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} />
          ))}
        </ul>
      )}

      {!loading && error && (
        <div className="requests__error">
          <p>{error}</p>
          <button type="button" onClick={load}>Try again</button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="requests__empty">
          <span className="requests__empty-icon" aria-hidden="true">
            <FiHeart />
          </span>
          <h2>No pending requests</h2>
          <p>When someone likes you, they&apos;ll show up here.</p>
          <Link to="/discover" className="requests__empty-cta">
            Find people
          </Link>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="requests-list">
          {items.map((it) => {
            const p = it.profile ?? {};
            const initials = (p.name || '?')
              .split(' ')
              .map((s) => s[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const primary =
              (p.photos ?? []).find((ph) => ph.isPrimary) ?? (p.photos ?? [])[0];
            const photo = primary?.url ?? placeholder(initials);

            const age = ageOf(p.birthdate);
            const busy = acting === p.userId;

            return (
              <li key={p.userId} className="request-row">
                <Link to={`/swipe?userId=${encodeURIComponent(p.userId)}`} className="request-row__profile">
                  <span className="request-row__avatar">
                    <img src={photo} alt="" loading="lazy" />
                  </span>
                  <span className="request-row__text">
                    <span className="request-row__name">
                      {p.name || 'Anonymous'}
                      {age != null && `, ${age}`}
                      {p.verified && (
                        <FaCheckCircle className="request-row__verified" aria-hidden="true" />
                      )}
                    </span>
                    <span className="request-row__meta">
                      {it.like?.kind === 'super_like' ? '⭐ Super liked you' : 'Liked your profile'}
                    </span>
                  </span>
                </Link>

                <div className="request-row__actions">
                  <button
                    type="button"
                    className="request-row__btn request-row__btn--accept"
                    onClick={() => approve(p.userId)}
                    disabled={busy}
                    aria-label={`Accept ${p.name}`}
                  >
                    <FiCheck />
                  </button>
                  <button
                    type="button"
                    className="request-row__btn request-row__btn--decline"
                    onClick={() => decline(p.userId)}
                    disabled={busy}
                    aria-label={`Decline ${p.name}`}
                  >
                    <FiX />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
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
