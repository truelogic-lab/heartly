import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiCheck, FiX } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { HiOutlineHeart } from 'react-icons/hi2';
import { profileApi } from '../api/profiles.js';
import { useSession } from '../context/SessionContext.jsx';

const INTEREST_OPTIONS = [
  { id: 'travel',      label: 'Travel',      emoji: '✈️' },
  { id: 'photography', label: 'Photography', emoji: '📷' },
  { id: 'coffee',      label: 'Coffee',      emoji: '☕' },
  { id: 'music',       label: 'Music',       emoji: '🎵' },
  { id: 'hiking',      label: 'Hiking',      emoji: '⛰️' },
  { id: 'movies',      label: 'Movies',      emoji: '🎬' },
  { id: 'gaming',      label: 'Gaming',      emoji: '🎮' },
  { id: 'dancing',     label: 'Dancing',     emoji: '💃' },
  { id: 'reading',     label: 'Reading',     emoji: '📚' },
  { id: 'fitness',     label: 'Fitness',     emoji: '💪' },
  { id: 'cooking',     label: 'Cooking',     emoji: '🍳' },
  { id: 'art',         label: 'Art',         emoji: '🎨' },
];

const LOOKING_FOR_OPTIONS = [
  { id: 'long-term', label: 'Long-term relationship' },
  { id: 'open',      label: 'Open to new connections' },
];

export default function InterestsPage() {
  const navigate = useNavigate();
  const { profile, reloadMe } = useSession();

  const [selected, setSelected] = useState(new Set());
  const [lookingFor, setLookingFor] = useState('long-term');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  /* Pre-load existing selections from the session profile */
  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    if (Array.isArray(profile.interests)) {
      setSelected(new Set(profile.interests));
    }
    if (profile.lookingFor) {
      setLookingFor(profile.lookingFor === 'everyone' ? 'open' : 'long-term');
    }
    setLoading(false);
  }, [profile]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSave = async () => {
    setError('');
    setSaving(true);
    try {
      await profileApi.update({
        interests: Array.from(selected),
        lookingFor: lookingFor === 'open' ? 'everyone' : 'women,men',
      });
      await reloadMe();
      navigate('/discover', { replace: true });
    } catch (e) {
      setError(e.message || 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const onSkip = () => {
    navigate('/discover', { replace: true });
  };

  return (
    <section className="interests-page">
      <header className="interests-page__top">
        <button
          type="button"
          className="interests-page__back"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <FiChevronLeft />
        </button>

        <h1 className="interests-page__title">Interests</h1>

        <button
          type="button"
          className="interests-page__skip"
          onClick={onSkip}
          aria-label="Skip"
        >
          <FiX />
        </button>
      </header>

      <div className="interests-page__scroll">
        <div className="interests-page__intro">
          <span className="interests-page__intro-icon">
            <HiOutlineHeart />
          </span>
          <div>
            <p className="interests-page__intro-title">What are you into?</p>
            <p className="interests-page__intro-sub">
              Pick what matters. We use it to find people who share your vibe.
            </p>
          </div>
        </div>

        <div className="interests-grid">
          {INTEREST_OPTIONS.map((opt) => {
            const isOn = selected.has(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                className={`interest-chip ${isOn ? 'is-on' : ''}`}
                aria-pressed={isOn}
                onClick={() => toggle(opt.id)}
              >
                <span className="interest-chip__icon" aria-hidden="true">
                  {opt.emoji}
                </span>
                <span className="interest-chip__label">{opt.label}</span>
                {isOn && (
                  <FiCheck className="interest-chip__check" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        <div className="interests-page__section">
          <h2 className="interests-page__section-title">Looking for</h2>

          <div className="looking-for">
            {LOOKING_FOR_OPTIONS.map((opt) => {
              const isOn = lookingFor === opt.id;
              const isLong = opt.id === 'long-term';
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`looking-for__option ${isOn ? 'is-on' : ''}`}
                  aria-pressed={isOn}
                  onClick={() => setLookingFor(opt.id)}
                >
                  <span
                    className={`looking-for__icon looking-for__icon--${
                      isLong ? 'red' : 'grey'
                    } ${isOn ? 'is-on' : ''}`}
                  >
                    {isLong ? <FaHeart /> : null}
                  </span>
                  <span className="looking-for__label">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="interests-page__error" role="alert">{error}</p>
        )}
      </div>

      <footer className="interests-page__footer">
        <button
          type="button"
          className="interests-page__save"
          onClick={onSave}
          disabled={saving || loading}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </footer>
    </section>
  );
}
