import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar } from 'react-icons/fi';
import OnboardingLayout from './OnboardingLayout.jsx';
import { profileApi } from '../../api/profiles.js';
import { useSession } from '../../context/SessionContext.jsx';

const MIN_AGE = 18;
const MAX_AGE = 100;

export default function BirthdatePage() {
  const navigate = useNavigate();
  const { profile, reloadMe } = useSession();

  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  /* Pre-fill from existing profile */
  useEffect(() => {
    if (!profile?.birthdate) return;
    const d = new Date(Number(profile.birthdate));
    setDay(String(d.getDate()));
    setMonth(String(d.getMonth() + 1));
    setYear(String(d.getFullYear()));
  }, [profile]);

  const onContinue = async () => {
    setError('');
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (!d || !m || !y) return setError('Please enter day, month, and year.');

    const dob = new Date(Date.UTC(y, m - 1, d));
    if (
      dob.getUTCDate() !== d ||
      dob.getUTCMonth() !== m - 1 ||
      dob.getUTCFullYear() !== y
    ) {
      return setError('That date does not exist.');
    }

    const now = new Date();
    let age = now.getUTCFullYear() - y;
    const monthDiff = now.getUTCMonth() - (m - 1);
    if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < d)) age--;

    if (age < MIN_AGE) return setError(`You must be at least ${MIN_AGE}.`);
    if (age > MAX_AGE) return setError('Please enter a valid birthdate.');

    setSaving(true);
    try {
      await profileApi.update({ birthdate: dob.getTime() });
      await reloadMe();
      navigate('/onboarding/gender', { replace: true });
    } catch (e) {
      setError(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const now = new Date();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  const years = Array.from({ length: 83 }, (_, i) => now.getUTCFullYear() - 18 - i);

  return (
    <OnboardingLayout
      step={1}
      title="When's your birthday?"
      subtitle="Your age will be visible on your profile."
      onContinue={onContinue}
      continueLoading={saving}
    >
      {error && <p className="onboarding__error" role="alert">{error}</p>}

      <div className="date-grid">
        <label className="date-field">
          <span>Day</span>
          <select value={day} onChange={(e) => setDay(e.target.value)}>
            <option value="">--</option>
            {days.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>

        <label className="date-field">
          <span>Month</span>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">--</option>
            {months.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
        </label>

        <label className="date-field">
          <span>Year</span>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">--</option>
            {years.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <p className="date-hint">
        <FiCalendar aria-hidden="true" /> Age is calculated from this. It never appears in chats.
      </p>
    </OnboardingLayout>
  );
}
