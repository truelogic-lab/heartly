import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiBell, FiEye, FiLock, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { useSession } from '../../context/SessionContext.jsx';

const TOGGLES = [
  { id: 'discoverable', label: 'Show me on Discover', desc: 'Let others find your profile nearby.', on: true, icon: <FiEye /> },
  { id: 'notifications', label: 'Push notifications', desc: 'New matches, messages and likes.', on: true, icon: <FiBell /> },
  { id: 'readReceipts', label: 'Read receipts', desc: 'Let others know when you read messages.', on: true, icon: <FiLock /> },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useSession();
  const [toggles, setToggles] = useState(TOGGLES);

  const toggle = (id) =>
    setToggles((prev) => prev.map((t) => t.id === id ? { ...t, on: !t.on } : t));

  const onDeactivate = async () => {
    if (!confirm('Deactivate your account? You can reactivate by signing back in.')) return;
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <section className="subpage">
      <header className="subpage__top">
        <button type="button" className="subpage__back" aria-label="Back" onClick={() => navigate(-1)}>
          <FiChevronLeft />
        </button>
        <h1 className="subpage__title">Settings</h1>
        <span className="subpage__spacer" />
      </header>

      <div className="subpage__body">
        <div className="settings-group">
          <p className="settings-group__label">Account</p>
          {toggles.map((t) => (
            <div key={t.id} className="settings-row">
              <span className="settings-row__icon">{t.icon}</span>
              <div className="settings-row__text">
                <p className="settings-row__title">{t.label}</p>
                <p className="settings-row__desc">{t.desc}</p>
              </div>
              <label className="settings-switch">
                <input type="checkbox" checked={t.on} onChange={() => toggle(t.id)} />
                <span className="settings-switch__track">
                  <span className="settings-switch__thumb" />
                </span>
              </label>
            </div>
          ))}
        </div>

        <div className="settings-group">
          <p className="settings-group__label">Danger zone</p>
          <button type="button" className="settings-danger" onClick={onDeactivate}>
            <FiAlertTriangle /> Deactivate account
          </button>
        </div>
      </div>
    </section>
  );
}
