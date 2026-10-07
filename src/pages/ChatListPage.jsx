import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMessageCircle, FiChevronRight } from 'react-icons/fi';
import { FaCheckCircle } from 'react-icons/fa';
import { HiOutlineHeart } from 'react-icons/hi2';
import { matchApi } from '../api/matches.js';

export default function ChatListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    matchApi
      .list()
      .then((r) => {
        if (cancelled) return;
        setItems(r?.items ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || 'Could not load matches');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const visible = query.trim()
    ? items.filter((it) =>
        (it.otherProfile?.name ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : items;

  return (
    <div className="chat-list-page">
      <header className="chat-list__top">
        <Link to="/discover" className="chat-list__brand">
          <HiOutlineHeart className="chat-list__brand-icon" />
          <span>Heartly</span>
        </Link>
      </header>

      <h1 className="chat-list__title">Messages</h1>

      <div className="chat-list__search">
        <FiSearch aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search matches..."
          aria-label="Search matches"
        />
      </div>

      {loading && (
        <ul className="chat-list__skeleton">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="chat-list__skeleton-row" />
          ))}
        </ul>
      )}

      {!loading && error && (
        <div className="chat-list__error">
          <p>{error}</p>
          <button
            type="button"
            className="chat-list__retry"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="chat-list__empty">
          <span className="chat-list__empty-icon" aria-hidden="true">
            <FiMessageCircle />
          </span>
          <h3>No messages yet</h3>
          <p>
            {query
              ? 'No match matches that name.'
              : 'Start liking people — when you match, your conversations appear here.'}
          </p>
          <button
            type="button"
            className="chat-list__empty-cta"
            onClick={() => navigate('/discover')}
          >
            Find people
          </button>
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <ul className="chat-list">
          {visible.map((it) => {
            const p = it.otherProfile ?? {};
            const initials = (p.name || '?')
              .split(' ')
              .map((s) => s[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const primary =
              (p.photos ?? []).find((ph) => ph.isPrimary) ?? (p.photos ?? [])[0];
            const photo = primary?.url ?? placeholder(initials);

            const preview = it.lastMessage?.body ?? 'You matched. Say hi!';
            const time = it.lastMessage?.createdAt
              ? formatTime(it.lastMessage.createdAt)
              : 'New';

            return (
              <li key={it.match.id}>
                <Link to={`/chat/${it.match.id}`} className="chat-row">
                  <span className="chat-row__avatar">
                    <img src={photo} alt="" loading="lazy" />
                  </span>

                  <div className="chat-row__body">
                    <div className="chat-row__head">
                      <span className="chat-row__name">
                        {p.name || 'Anonymous'}
                        {p.verified && (
                          <FaCheckCircle
                            className="chat-row__verified"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      <span className="chat-row__time">{time}</span>
                    </div>
                    <p className="chat-row__preview">{preview}</p>
                  </div>

                  <FiChevronRight className="chat-row__chev" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatTime(ms) {
  const d = new Date(ms);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
