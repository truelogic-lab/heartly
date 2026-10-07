import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiChevronLeft, FiShield, FiEye, FiUserX, FiAlertOctagon,
  FiSlash, FiFileText, FiChevronRight,
} from 'react-icons/fi';
import { safetyApi } from '../../api/safety.js';

export default function PrivacyPage() {
  const navigate = useNavigate();
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    safetyApi
      .listBlocked()
      .then((r) => setBlockedCount(r?.items?.length ?? 0))
      .catch(() => {});
  }, []);

  const items = [
    { icon: <FiEye />,          label: 'Who can see me',      to: '/profile/privacy/visibility' },
    { icon: <FiUserX />,        label: 'Blocked accounts',    to: '/profile/privacy/blocked', value: blockedCount > 0 ? String(blockedCount) : '' },
    { icon: <FiAlertOctagon />, label: 'Report a problem',    to: '/profile/privacy/report' },
    { icon: <FiSlash />,        label: 'Hide my profile',     to: '/profile/privacy/visibility' },
    { icon: <FiFileText />,     label: 'Safety guidelines',   to: '/profile/privacy/guidelines' },
    { icon: <FiShield />,       label: 'Data & privacy',      to: '/profile/privacy/data' },
  ];

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
        <h1 className="subpage__title">Privacy & Safety</h1>
        <span className="subpage__spacer" />
      </header>

      <div className="subpage__body">
        <div className="privacy-banner">
          <span className="privacy-banner__icon"><FiShield /></span>
          <div>
            <p className="privacy-banner__title">You&apos;re in control</p>
            <p className="privacy-banner__sub">
              Manage who sees you and how your data is used.
            </p>
          </div>
        </div>

        <ul className="subpage-menu">
          {items.map((it) => (
            <li key={it.label}>
              <Link to={it.to} className="subpage-menu__item">
                <span className="subpage-menu__icon">{it.icon}</span>
                <span className="subpage-menu__label">{it.label}</span>
                {it.value && <span className="subpage-menu__value">{it.value}</span>}
                <FiChevronRight className="subpage-menu__chev" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
