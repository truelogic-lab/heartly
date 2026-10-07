import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiHeart, FiX, FiEdit2 } from 'react-icons/fi';
import { HiOutlineHeart } from 'react-icons/hi2';
import { discoveryApi } from '../api/discovery.js';
import { useSession } from '../context/SessionContext.jsx';

export default function DiscoverPage() {
  const { profile, user } = useSession();
  const [tab, setTab] = useState('near');   // 'near' | 'friends'
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* Fetch discovery feed from the API */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    discoveryApi
      .feed({ limit: 30 })
      .then((res) => {
        if (cancelled) return;
        setItems(res?.items ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || 'Could not load people');
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  /* Filter by the search query (client-side, on top of the API result) */
  const visible = query.trim()
    ? items.filter((it) => {
        const p = it.profile ?? {};
        const q = query.toLowerCase();
        return (
          (p.name ?? '').toLowerCase().includes(q) ||
          (p.interests ?? []).some((i) => i.toLowerCase().includes(q))
        );
      })
    : items;

  /* Split the feed into the two sections */
  const nearYou = visible.slice(0, 8);
  const makeFriends = visible.slice(0, 6);

  const firstName = (user?.name || 'there').split(' ')[0];

  return (
    <div className="discover-page">
      {/* Top bar */}
      <header className="discover__top">
        <Link to="/discover" className="discover__brand">
          <HiOutlineHeart className="discover__brand-icon" />
          <span>Heartly</span>
        </Link>

        <Link
          to="/profile"
          className="discover__icon-btn"
          aria-label="Edit profile"
        >
          <FiEdit2 />
        </Link>
      </header>

      {/* Title */}
      <div className="discover__head">
        <p className="discover__hi">Hi, {firstName}</p>
        <h1 className="discover__title">Discover</h1>
      </div>

      {/* Search */}
      <div className="discover__search">
        <FiSearch aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, interests..."
          aria-label="Search"
        />
      </div>

      {/* Tabs */}
      <div className="discover__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'near'}
          className={`discover__tab ${tab === 'near' ? 'is-active' : ''}`}
          onClick={() => setTab('near')}
        >
          Near You
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'friends'}
          className={`discover__tab ${tab === 'friends' ? 'is-active' : ''}`}
          onClick={() => setTab('friends')}
        >
          Make Friends
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="discover__skeleton-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="discover__skeleton" />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="discover__error">
          <p>{error}</p>
          <button
            type="button"
            className="discover__retry"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && visible.length === 0 && (
        <div className="discover__empty">
          <span className="discover__empty-icon" aria-hidden="true">
            <HiOutlineHeart />
          </span>
          <h3 className="discover__empty-title">
            {query ? 'No matches for that search' : 'You\'re early'}
          </h3>
          <p className="discover__empty-copy">
            {query
              ? 'Try a different name or interest.'
              : 'Heartly is growing. Come back soon, or invite a friend.'}
          </p>
        </div>
      )}

      {/* Near You */}
      {!loading && !error && visible.length > 0 && tab === 'near' && (
        <section className="discover__section">
          <div className="discover__section-head">
            <h2 className="discover__section-title">Near You</h2>
            <span className="discover__count">{nearYou.length}</span>
          </div>

          <div className="near-cards">
            {nearYou.map((it) => (
              <NearCard key={it.profile?.id ?? it.profile?.userId} item={it} />
            ))}
          </div>
        </section>
      )}

      {/* Make Friends */}
      {!loading && !error && visible.length > 0 && tab === 'friends' && (
        <section className="discover__section">
          <div className="discover__section-head">
            <h2 className="discover__section-title">Make Friends</h2>
            <span className="discover__count">{makeFriends.length}</span>
          </div>

          <ul className="friend-list">
            {makeFriends.map((it) => (
              <FriendRow
                key={it.profile?.id ?? it.profile?.userId}
                item={it}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ---------- Near You card ---------- */
function NearCard({ item }) {
  const p = item.profile ?? {};
  const primary = (p.photos ?? []).find((ph) => ph.isPrimary) ?? (p.photos ?? [])[0];
  const photo = primary?.url ?? placeholderImage(p.name);

  const distanceKm = estimateDistance(item.compatibility);

  return (
    <Link
      to={`/swipe?userId=${encodeURIComponent(p.userId)}`}
      className="near-card"
    >
      <div className="near-card__photo">
        <img src={photo} alt="" loading="lazy" />
        <span className="near-card__dot" />
      </div>
      <p className="near-card__name">{p.name || 'Anonymous'}</p>
      <p className="near-card__meta">
        <span>{ageOf(p.birthdate) ?? '—'}</span>
        <span className="near-card__km">{distanceKm} km</span>
      </p>
    </Link>
  );
}

/* ---------- Make Friends row ---------- */
function FriendRow({ item }) {
  const p = item.profile ?? {};
  const primary = (p.photos ?? []).find((ph) => ph.isPrimary) ?? (p.photos ?? [])[0];
  const photo = primary?.url ?? placeholderImage(p.name);

  const interests = (p.interests ?? []).slice(0, 2).join(' · ') || 'New here';

  return (
    <li className="friend-row">
      <Link
        to={`/swipe?userId=${encodeURIComponent(p.userId)}`}
        className="friend-row__profile"
      >
        <span className="friend-row__avatar">
          <img src={photo} alt="" loading="lazy" />
        </span>
        <span className="friend-row__text">
          <span className="friend-row__name">
            {p.name || 'Anonymous'}, {ageOf(p.birthdate) ?? '—'}
          </span>
          <span className="friend-row__meta">{interests}</span>
        </span>
      </Link>

      <Link
        to={`/swipe?userId=${encodeURIComponent(p.userId)}`}
        className="friend-row__add"
        aria-label={`View ${p.name || 'profile'}`}
      >
        <FiHeart />
      </Link>
    </li>
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

function estimateDistance(compatibility) {
  // Crude mapping so the UI has numbers. Real distances come when we
  // compute from location in a later pass.
  const c = Number(compatibility) || 50;
  return (Math.max(1, 12 - Math.round(c / 10)) + 0.1).toFixed(1);
}

function placeholderImage(name = '') {
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FFE5EA"/>
          <stop offset="1" stop-color="#FFB7C3"/>
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#g)"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
            fill="#E62E4E" font-family="Inter, sans-serif" font-weight="800"
            font-size="120">${initials}</text>
    </svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
