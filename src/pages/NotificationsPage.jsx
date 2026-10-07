import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiBell, FiHeart, FiUser, FiMessageCircle, FiChevronLeft, FiChevronRight, FiStar,
} from 'react-icons/fi';
import { HiOutlineHeart } from 'react-icons/hi2';
import { notificationsApi } from '../api/notifications.js';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    notificationsApi
      .list()
      .then((r) => setItems(r?.items ?? []))
      .catch((e) => setError(e.message || 'Could not load notifications'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="notifications-page">
      <header className="notifications-top">
        <button
          type="button"
          className="notifications-back"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <FiChevronLeft />
        </button>
        <Link to="/discover" className="notifications-brand">
          <HiOutlineHeart className="notifications-brand-icon" />
          <span>Heartly</span>
        </Link>
        <span className="notifications-spacer" />
      </header>

      <h1 className="notifications-title">Notifications</h1>

      {loading && (
        <ul className="notif-skeleton">
          {Array.from({ length: 4 }).map((_, i) => <li key={i} />)}
        </ul>
      )}

      {!loading && error && (
        <div className="notifications-error">
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="notifications-empty">
          <span className="notifications-empty__icon"><FiBell /></span>
          <h3>All caught up</h3>
          <p>New likes, matches, and messages will show up here.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="notif-list-page">
          {items.map((it) => (
            <li key={it.id}>
              <Link to={it.actionTo} className={`notif-row notif-row--${it.type}`}>
                <span className="notif-row__avatar">
                  <span className="notif-row__initials">{it.user.initials}</span>
                  <span className={`notif-row__dot notif-row__dot--${it.type}`}>
                    {it.type === 'like' && it.kind === 'super_like' && <FiStar />}
                    {it.type === 'like' && it.kind !== 'super_like' && <FiHeart />}
                    {it.type === 'match' && <FiUser />}
                    {it.type === 'message' && <FiMessageCircle />}
                  </span>
                </span>

                <span className="notif-row__text">
                  <span className="notif-row__line">{it.text}</span>
                  <span className="notif-row__time">{formatTime(it.at)}</span>
                </span>

                <FiChevronRight className="notif-row__chev" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatTime(ms) {
  const d = new Date(ms);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
