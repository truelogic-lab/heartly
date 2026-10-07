import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { HiOutlineHeart } from 'react-icons/hi2';
import { passwordResetApi } from '../api/passwordReset.js';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await passwordResetApi.forgot(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send reset email');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-page__inner">
        <header className="auth-page__head">
          <Link to="/login" className="auth-page__back">
            <FiArrowLeft /> Back to sign in
          </Link>
          <Link to="/" className="auth-page__brand">
            <HiOutlineHeart className="auth-page__brand-icon" />
            <span>Heartly</span>
          </Link>
          <h1 className="auth-page__title">Reset your password</h1>
          <p className="auth-page__sub">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </header>

        {sent ? (
          <div className="forgot-success">
            <span className="forgot-success__icon"><FiCheckCircle /></span>
            <h2 className="forgot-success__title">Check your inbox</h2>
            <p className="forgot-success__text">
              If an account exists for <strong>{email}</strong>, you&apos;ll
              receive an email with a link to reset your password.
            </p>
            <p className="forgot-success__hint">
              Didn&apos;t get it? Check spam or wait a minute, then try again.
            </p>
            <button
              type="button"
              className="forgot-success__again"
              onClick={() => setSent(false)}
            >
              Try a different email
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            {error && <p className="auth-form__error" role="alert">{error}</p>}

            <label className="auth-field">
              <span className="auth-field__label">Email</span>
              <span className="auth-field__input-wrap">
                <FiMail className="auth-field__icon" aria-hidden="true" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </span>
            </label>

            <button
              type="submit"
              className="auth-form__submit"
              disabled={submitting || !email.includes('@')}
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>

            <p className="auth-form__alt">
              Remembered it? <Link to="/login">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
