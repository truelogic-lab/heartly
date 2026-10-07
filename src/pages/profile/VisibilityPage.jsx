import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiChevronLeft, FiGlobe, FiUsers, FiLock, FiCheck } from 'react-icons/fi';
import { safetyApi } from '../../api/safety.js';

const OPTIONS = [
  {
    id: 'everyone',
    icon: <FiGlobe />,
    label: 'Everyone',
    desc: 'Anyone on Heartly can see and match with you.',
  },
  {
    id: 'matches',
    icon: <FiUsers />,
    label: 'Matches only',
    desc: 'Only people you have already matched with can see you.',
  },
  {
    id: 'nobody',
    icon: <FiLock />,
    label: 'Nobody',
    desc: 'Your profile is hidden. You can still browse and like.',
  },
];

export default function VisibilityPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('everyone');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    safetyApi
      .getVisibility()
      .then((r) => setSelected(r?.visibility || 'everyone'))
      .catch((e) => setError(e.message || 'Could not load'))
      .finally(() => setLoading(false));
  }, []);

  const onPick = async (id) => {
    setSelected(id);
    setSaving(true);
    setError('');
    try {
      await safetyApi.setVisibility(id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message || 'Could not save');
      // Revert on failure
      setSelected(selected);
    } finally {
      setSaving(false);
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
        <h1 className="subpage__title">Who can see me</h1>
        <span className="subpage__spacer" />
      </header>

      <div className="subpage__body">
        <p className="subpage__lead">
          Control who can find your profile in Discover.
        </p>

        {error && <p className="subpage__error">{error}</p>}
        {saved && <p className="subpage__saved"><FiCheck /> Saved</p>}

        <ul className="visibility-list">
          {OPTIONS.map((opt) => {
            const isOn = selected === opt.id;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  className={`visibility-option ${isOn ? 'is-on' : ''}`}
                  onClick={() => onPick(opt.id)}
                  disabled={loading || saving}
                >
                  <span className="visibility-option__icon">{opt.icon}</span>
                  <span className="visibility-option__text">
                    <span className="visibility-option__label">{opt.label}</span>
                    <span className="visibility-option__desc">{opt.desc}</span>
                  </span>
                  {isOn && <FiCheck className="visibility-option__check" />}
                </button>
              </li>
            );
          })}
        </ul>

        <Link to="/profile/privacy" className="subpage__back-link">
          Back to Privacy & Safety
        </Link>
      </div>
    </section>
  );
}
