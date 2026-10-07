import { Link, useNavigate } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi';
import { HiOutlineHeart } from 'react-icons/hi2';

/**
 * Shared shell for the onboarding steps.
 * Shows: back button, Heartly brand, progress dots (1-3),
 * title + subtitle, children (the form), sticky Continue button.
 */
export default function OnboardingLayout({
  step,        // 1 | 2 | 3
  title,
  subtitle,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
  continueLoading = false,
  children,
}) {
  const navigate = useNavigate();
  const total = 3;

  return (
    <section className="onboarding">
      {/* Top bar */}
      <header className="onboarding__bar">
        <button
          type="button"
          className="onboarding__back"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <FiChevronLeft />
        </button>

        <Link to="/discover" className="onboarding__brand" aria-label="Heartly">
          <HiOutlineHeart className="onboarding__brand-icon" />
          <span>Heartly</span>
        </Link>

        <span className="onboarding__bar-spacer" aria-hidden="true" />
      </header>

      {/* Progress */}
      <div className="onboarding__progress" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => {
          const n = i + 1;
          const state = n < step ? 'is-done' : n === step ? 'is-active' : '';
          return (
            <span key={n} className="onboarding__progress-item">
              <span className={`onboarding__dot ${state}`}>{String(n).padStart(2, '0')}</span>
              {n < total && <span className={`onboarding__line ${n < step ? 'is-done' : ''}`} />}
            </span>
          );
        })}
      </div>

      {/* Copy */}
      <header className="onboarding__head">
        <h1 className="onboarding__title">{title}</h1>
        {subtitle && <p className="onboarding__sub">{subtitle}</p>}
      </header>

      {/* Form body */}
      <div className="onboarding__body">{children}</div>

      {/* Footer */}
      <footer className="onboarding__footer">
        <button
          type="button"
          className="onboarding__submit"
          onClick={onContinue}
          disabled={continueDisabled || continueLoading}
        >
          {continueLoading ? 'Saving…' : continueLabel}
        </button>
      </footer>
    </section>
  );
}
