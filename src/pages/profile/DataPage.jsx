import { useNavigate, Link } from 'react-router-dom';
import { FiChevronLeft, FiDownload, FiTrash2, FiFileText, FiDatabase } from 'react-icons/fi';

export default function DataPage() {
  const navigate = useNavigate();

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
        <h1 className="subpage__title">Data & Privacy</h1>
        <span className="subpage__spacer" />
      </header>

      <div className="subpage__body">
        <p className="subpage__lead">
          What we store, how we use it, and how to remove it.
        </p>

        <div className="data-card">
          <span className="data-card__icon"><FiDatabase /></span>
          <h2 className="data-card__title">What we store</h2>
          <ul className="data-card__list">
            <li>Your email and name (for login and account)</li>
            <li>Your profile: bio, photos, interests, gender, age, location</li>
            <li>Your activity: likes, matches, messages</li>
            <li>Session and device info (for security)</li>
          </ul>
        </div>

        <div className="data-card">
          <span className="data-card__icon"><FiFileText /></span>
          <h2 className="data-card__title">How we use it</h2>
          <ul className="data-card__list">
            <li>To show you people nearby who match your preferences</li>
            <li>To deliver messages and matches</li>
            <li>To keep the platform safe from abuse</li>
            <li>To improve the product (aggregate analytics only)</li>
          </ul>
        </div>

        <div className="data-card">
          <span className="data-card__icon"><FiDownload /></span>
          <h2 className="data-card__title">Your rights</h2>
          <ul className="data-card__list">
            <li>You can download your data at any time</li>
            <li>You can delete your account at any time</li>
            <li>You can control visibility in Privacy settings</li>
            <li>You can contact us for anything else</li>
          </ul>
        </div>

        <div className="data-actions">
          <button
            type="button"
            className="data-action data-action--export"
            onClick={() => alert('Data export is coming soon.')}
          >
            <FiDownload /> Request data export
          </button>

          <Link
            to="/profile/delete"
            className="data-action data-action--delete"
          >
            <FiTrash2 /> Delete my account
          </Link>
        </div>

        <Link to="/profile/privacy" className="subpage__back-link">
          Back to Privacy & Safety
        </Link>
      </div>
    </section>
  );
}
