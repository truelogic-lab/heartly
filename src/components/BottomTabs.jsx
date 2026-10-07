import { NavLink } from 'react-router-dom';
import { FiHome, FiHeart, FiMessageCircle, FiUser } from 'react-icons/fi';

const TABS = [
  { to: '/discover', label: 'Home', icon: <FiHome /> },
  { to: '/interests', label: 'Likes', icon: <FiHeart /> },
  { to: '/chat', label: 'Chat', icon: <FiMessageCircle /> },
  { to: '/profile', label: 'Profile', icon: <FiUser /> },
];

export default function BottomTabs() {
  return (
    <nav className="tabbar" aria-label="Primary navigation">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            `tabbar__item ${isActive ? 'is-active' : ''}`
          }
        >
          {t.icon}
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
