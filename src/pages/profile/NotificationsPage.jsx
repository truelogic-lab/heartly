import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiHeart, FiMessageCircle, FiStar, FiUser } from 'react-icons/fi';

const TYPES = [
  { id: 'likes',    icon: <FiHeart />,         label: 'New likes',     sub: 'When someone likes your profile', on: true },
  { id: 'matches',  icon: <FiUser />,          label: 'New matches',   sub: 'When you match with someone',     on: true },
  { id: 'messages', icon: <FiMessageCircle />, label: 'Messages',      sub: 'New chat messages',               on: true },
  { id: 'super',    icon: <FiStar />,          label: 'Super likes',   sub: 'When someone super likes you',    on: false },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [list, setList] = useState(TYPES);

  const toggle = (id) =>
    setList((prev) => prev.map((t) => t.id === id ? { ...t, on: !t.on } : t));

  return (
    <section className="subpage">
      <header className="subpage__top">
        <button type="button" className="subpage__back" aria-label="Back" onClick={() => navigate(-1)}>
          <FiChevronLeft />
        </button>
        <h1 className="subpage__title">Notifications</h1>
        <span className="subpage__spacer" />
      </header>

      <div className="subpage__body">
        <p className="subpage__lead">Choose what you want to be notified about.</p>

        <ul className="notif-list">
          {list.map((t) => (
            <li key={t.id} className="notif-item">
              <span className="notif-item__icon">{t.icon}</span>
              <div className="notif-item__text">
                <p className="notif-item__label">{t.label}</p>
                <p className="notif-item__sub">{t.sub}</p>
              </div>
              <label className="settings-switch">
                <input type="checkbox" checked={t.on} onChange={() => toggle(t.id)} />
                <span className="settings-switch__track">
                  <span className="settings-switch__thumb" />
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
