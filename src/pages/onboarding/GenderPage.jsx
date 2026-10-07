import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck } from 'react-icons/fi';
import OnboardingLayout from './OnboardingLayout.jsx';
import { profileApi } from '../../api/profiles.js';
import { useSession } from '../../context/SessionContext.jsx';

const GENDERS = [
  { id: 'woman',      label: 'Woman',          emoji: '👩' },
  { id: 'man',        label: 'Man',            emoji: '👨' },
  { id: 'non_binary', label: 'Non-binary',     emoji: '🌈' },
  { id: 'other',      label: 'Prefer to self-describe', emoji: '✨' },
];

const LOOKING_FOR = [
  { id: 'women',    label: 'Women' },
  { id: 'men',      label: 'Men' },
  { id: 'everyone', label: 'Everyone' },
];

export default function GenderPage() {
  const navigate = useNavigate();
  const { profile, reloadMe } = useSession();

  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('everyone');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.gender) setGender(profile.gender);
    if (profile?.lookingFor) setLookingFor(profile.lookingFor);
  }, [profile]);

  const onContinue = async () => {
    setError('');
    if (!gender) return setError('Please pick your gender.');

    setSaving(true);
    try {
      await profileApi.update({
        gender,
        lookingFor,
      });
      await reloadMe();
      navigate('/onboarding/location', { replace: true });
    } catch (e) {
      setError(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingLayout
      step={2}
      title="How do you identify?"
      subtitle="We use this to show you the right people."
      onContinue={onContinue}
      continueLoading={saving}
    >
      {error && <p className="onboarding__error" role="alert">{error}</p>}

      <div className="gender-list">
        {GENDERS.map((g) => {
          const isOn = gender === g.id;
          return (
            <button
              key={g.id}
              type="button"
              className={`gender-option ${isOn ? 'is-on' : ''}`}
              onClick={() => setGender(g.id)}
              aria-pressed={isOn}
            >
              <span className="gender-option__emoji" aria-hidden="true">{g.emoji}</span>
              <span className="gender-option__label">{g.label}</span>
              {isOn && <FiCheck className="gender-option__check" />}
            </button>
          );
        })}
      </div>

      <div className="onboarding__section">
        <p className="onboarding__section-title">Show me</p>
        <div className="looking-for-chips">
          {LOOKING_FOR.map((opt) => {
            const isOn = lookingFor === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`chip-pill ${isOn ? 'is-on' : ''}`}
                onClick={() => setLookingFor(opt.id)}
                aria-pressed={isOn}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </OnboardingLayout>
  );
}
