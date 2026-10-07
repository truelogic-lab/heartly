import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiChevronLeft, FiAlertTriangle, FiLock } from 'react-icons/fi';
import { accountApi } from '../../api/account.js';
import { useSession } from '../../context/SessionContext.jsx';

const CONFIRM_PHRASE = 'DELETE';

export default function DeleteAccountPage() {
  const navigate = useNavigate();
  const { logout } = useSession();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canDelete = password.length > 0 && confirm === CONFIRM_PHRASE;

  const onDelete = async () => {
    setError('');
    if (!canDelete) return;
    if (!confirm('This is permanent. Delete your account now?')) return;

    setDeleting(true);
    try {
      await accountApi.deleteAccount(password, confirm);
      await logout();
      navigate('/login', { replace: true });
    } catch (e) {
      setError(e.message || 'Could not delete account');
    } finally {
      setDeleting(false);
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
        <h1 className="subpage__title">Delete account</h1>
        <span className="subpage__spacer" />
      </header>

      <div className="subpage__body">
        <div className="delete-warning">
          <span className="delete-warning__icon"><FiAlertTriangle /></span>
          <div>
            <p className="delete-warning__title">This cannot be undone</p>
            <p className="delete-warning__sub">
              Your profile, photos, matches, and messages will be permanently removed.
            </p>
          </div>
        </div>

        <div className="delete-list">
          <p className="delete-list__title">What gets deleted</p>
          <ul className="delete-list__items">
            <li>Your profile and all photos</li>
            <li>Your matches and conversations</li>
            <li>Your likes and passes</li>
            <li>Your account and login credentials</li>
          </ul>
        </div>

        {error && <p className="subpage__error" role="alert">{error}</p>}

        <label className="delete-field">
          <span>Confirm your password</span>
          <span className="delete-field__wrap">
            <FiLock className="delete-field__icon" aria-hidden="true" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </span>
        </label>

        <label className="delete-field">
          <span>Type <strong>{CONFIRM_PHRASE}</strong> to confirm</span>
          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            autoComplete="off"
          />
        </label>

        <button
          type="button"
          className="delete-submit"
          onClick={onDelete}
          disabled={!canDelete || deleting}
        >
          {deleting ? 'Deleting…' : 'Permanently delete my account'}
        </button>

        <Link to="/profile/privacy/data" className="subpage__back-link">
          Cancel and go back
        </Link>
      </div>
    </section>
  );
}
