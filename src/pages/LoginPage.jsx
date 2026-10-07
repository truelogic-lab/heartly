import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { HiOutlineHeart } from 'react-icons/hi2';
import { useSession } from '../context/SessionContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useSession();
  const from = location.state?.from?.pathname || '/discover';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-page__inner">
        <header className="auth-page__head">
          <Link to="/" className="auth-page__brand">
            <HiOutlineHeart className="auth-page__brand-icon" />
            <span>Heartly</span>
          </Link>
          <h1 className="auth-page__title">Welcome back</h1>
          <p className="auth-page__sub">Sign in to keep making real connections.</p>
        </header>

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

          <label className="auth-field">
            <span className="auth-field__label">Password</span>
            <span className="auth-field__input-wrap">
              <FiLock className="auth-field__icon" aria-hidden="true" />
              <input
                type="password"
                placeholder="Your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </span>
          </label>

          <button
            type="submit"
            className="auth-form__submit"
            disabled={submitting}
          >
            <span>{submitting ? 'Signing in…' : 'Sign In'}</span>
            {!submitting && <FiArrowRight aria-hidden="true" />}
          </button>

          <p className="auth-form__alt">
            New to Heartly? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
