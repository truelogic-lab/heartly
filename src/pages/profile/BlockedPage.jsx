import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiChevronLeft, FiUserX, FiCheck } from 'react-icons/fi';
import { safetyApi } from '../../api/safety.js';

export default function BlockedPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unblockingId, setUnblockingId] = useState(null);
  const [unblockedFlash, setUnblockedFlash] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    safetyApi
      .listBlocked()
      .then((r) => setItems(r?.items ?? []))
      .catch((e) => setError(e.message || 'Could not load blocked users'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const onUnblock = async (userId) => {
    if (!confirm('Unblock this user? They can appear in your feed again.')) return;
    setUnblockingId(userId);
    try {
      await safetyApi.unblock(userId);
      setItems((list) => list.filter((it) => it.userId !== userId));
      setUnblockedFlash(userId);
      setTimeout(() => setUnblockedFlash(null), 2000);
    } catch (e) {
      alert(e.message || 'Could not unblock');
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <section className="subpage">
      <header className="subpage__top">
        <button
          type="button"
          className="subpage__back"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <FiChevronLeft />
        </button>
        <h1 className="subpage__title">Blocked accounts</h1>
        <span className="subpage__spacer" />
      </header>

      <div className="subpage__body">
        <p className="subpage__lead">
          Blocked users cannot see you, message you, or appear in your feed.
        </p>

        {loading && (
          <ul className="blocked-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="blocked-skeleton" />
            ))}
          </ul>
        )}

        {!loading && error && (
          <div className="subpage__error">
            <p>{error}</p>
            <button type="button" onClick={load}>Try again</button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="blocked-empty">
            <span className="blocked-empty__icon"><FiUserX /></span>
            <h3>No blocked accounts</h3>
            <p>When you block someone, they&apos;ll appear here.</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <ul className="blocked-list">
            {items.map((it) => {
              const p = it.profile ?? {};
              const initials = (p.name || '?')
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              const isUnblocking = unblockingId === it.userId;

              return (
                <li key={it.blockId} className="blocked-row">
                  <span className="blocked-row__avatar">
                    <span className="blocked-row__initials">{initials}</span>
                  </span>

                  <div className="blocked-row__text">
                    <p className="blocked-row__name">{p.name || 'Anonymous'}</p>
                    <p className="blocked-row__meta">
                      Blocked {formatDate(it.blockedAt)}
                    </p>
                  </div>

                  {unblockedFlash === it.userId ? (
                    <span className="blocked-row__done"><FiCheck /> Unblocked</span>
                  ) : (
                    <button
                      type="button"
                      className="blocked-row__unblock"
                      onClick={() => onUnblock(it.userId)}
                      disabled={isUnblocking}
                    >
                      {isUnblocking ? 'Unblocking…' : 'Unblock'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <Link to="/profile/privacy" className="subpage__back-link">
          Back to Privacy & Safety
        </Link>
      </div>
    </section>
  );
}

function formatDate(ms) {
  const d = new Date(ms);
  const now = new Date();
  const diff = (now - d) / (1000 * 60 * 60 * 24);
  if (diff < 1) return 'today';
  if (diff < 7) return `${Math.floor(diff)} day${Math.floor(diff) === 1 ? '' : 's'} ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
