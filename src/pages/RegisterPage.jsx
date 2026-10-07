import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiArrowRight } from 'react-icons/fi';
import { HiOutlineHeart } from 'react-icons/hi2';
import { useSession } from '../context/SessionContext.jsx';

const PASSWORD_MIN = 8;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      return setError('Please enter your name.');
    }
    if (!email.includes('@')) {
      return setError('Please enter a valid email.');
    }
    if (password.length < PASSWORD_MIN) {
      return setError(`Password must be at least ${PASSWORD_MIN} characters.`);
    }
    if (!agree) {
      return setError('Please accept the Terms and Privacy Policy.');
    }

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      navigate('/interests', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
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
          <h1 className="auth-page__title">Create account</h1>
          <p className="auth-page__sub">Real connections start here.</p>
        </header>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {error && <p className="auth-form__error" role="alert">{error}</p>}

          <label className="auth-field">
            <span className="auth-field__label">Full name</span>
            <span className="auth-field__input-wrap">
              <FiUser className="auth-field__icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Your name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </span>
          </label>

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
                placeholder={`At least ${PASSWORD_MIN} characters`}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={PASSWORD_MIN}
              />
            </span>
          </label>

          <label className="auth-check">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              I agree to the <a href="#terms">Terms</a> and{' '}
              <a href="#privacy">Privacy Policy</a>.
            </span>
          </label>

          <button
            type="submit"
            className="auth-form__submit"
            disabled={submitting}
          >
            <span>{submitting ? 'Creating…' : 'Create Account'}</span>
            {!submitting && <FiArrowRight aria-hidden="true" />}
          </button>

          <p className="auth-form__alt">
            Already a member? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
