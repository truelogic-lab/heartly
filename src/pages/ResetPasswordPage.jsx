import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiLock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { HiOutlineHeart } from 'react-icons/hi2';
import { passwordResetApi } from '../api/passwordReset.js';

const MIN = 8;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) return setError('Missing reset token.');
    if (password.length < MIN) return setError(`Password must be at least ${MIN} characters.`);
    if (password !== confirm) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      await passwordResetApi.reset(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not reset password');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <section className="auth-page">
        <div className="auth-page__inner">
          <div className="reset-invalid">
            <span className="reset-invalid__icon"><FiAlertCircle /></span>
            <h2>Invalid link</h2>
            <p>This password reset link is missing its token. Request a new one.</p>
            <Link to="/forgot-password" className="reset-invalid__cta">
              Request new link
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-page__inner">
        <header className="auth-page__head">
          <Link to="/" className="auth-page__brand">
            <HiOutlineHeart className="auth-page__brand-icon" />
            <span>Heartly</span>
          </Link>
          <h1 className="auth-page__title">Set a new password</h1>
          <p className="auth-page__sub">
            Choose a strong password you haven&apos;t used before.
          </p>
        </header>

        {done ? (
          <div className="forgot-success">
            <span className="forgot-success__icon"><FiCheckCircle /></span>
            <h2 className="forgot-success__title">Password updated</h2>
            <p className="forgot-success__text">
              You can now sign in with your new password.
            </p>
            <button
              type="button"
              className="forgot-success__again"
              onClick={() => navigate('/login', { replace: true })}
            >
              Go to sign in
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            {error && <p className="auth-form__error" role="alert">{error}</p>}

            <label className="auth-field">
              <span className="auth-field__label">New password</span>
              <span className="auth-field__input-wrap">
                <FiLock className="auth-field__icon" aria-hidden="true" />
                <input
                  type="password"
                  placeholder={`At least ${MIN} characters`}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={MIN}
                />
              </span>
            </label>

            <label className="auth-field">
              <span className="auth-field__label">Confirm password</span>
              <span className="auth-field__input-wrap">
                <FiLock className="auth-field__icon" aria-hidden="true" />
                <input
                  type="password"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={MIN}
                />
              </span>
            </label>

            <button
              type="submit"
              className="auth-form__submit"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
