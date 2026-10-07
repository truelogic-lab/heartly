import { useNavigate, Link } from 'react-router-dom';
import { FiChevronLeft, FiShield, FiHeart, FiAlertCircle, FiUserCheck } from 'react-icons/fi';

const SECTIONS = [
  {
    icon: <FiUserCheck />,
    title: 'Be yourself',
    items: [
      'Use recent photos of yourself, no one else.',
      'Write your own bio — don\'t copy others.',
      'Be honest about your age and intentions.',
    ],
  },
  {
    icon: <FiHeart />,
    title: 'Be kind',
    items: [
      'Treat everyone with respect.',
      'No harassment, hate speech, or threats.',
      'Report behaviour that crosses a line.',
    ],
  },
  {
    icon: <FiAlertCircle />,
    title: 'Stay safe',
    items: [
      'Never send money to someone you haven\'t met.',
      'Meet in public places for first dates.',
      'Tell a friend where you\'re going.',
      'Trust your instincts — if something feels off, it is.',
    ],
  },
  {
    icon: <FiShield />,
    title: 'What we do',
    items: [
      'We review every report within 24 hours.',
      'We verify photos and remove fake profiles.',
      'We never share your data with third parties.',
      'We never sell your information.',
    ],
  },
];

export default function GuidelinesPage() {
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
        <h1 className="subpage__title">Safety guidelines</h1>
        <span className="subpage__spacer" />
      </header>

      <div className="subpage__body">
        <p className="subpage__lead">
          Heartly works best when everyone feels safe. Here&apos;s what we expect.
        </p>

        <div className="guidelines">
          {SECTIONS.map((s) => (
            <article key={s.title} className="guideline-card">
              <span className="guideline-card__icon">{s.icon}</span>
              <h2 className="guideline-card__title">{s.title}</h2>
              <ul className="guideline-card__list">
                {s.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <Link to="/profile/privacy" className="subpage__back-link">
          Back to Privacy & Safety
        </Link>
      </div>
    </section>
  );
}
