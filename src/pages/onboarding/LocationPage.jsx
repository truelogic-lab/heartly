import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiCheck, FiCrosshair } from 'react-icons/fi';
import OnboardingLayout from './OnboardingLayout.jsx';
import { profileApi } from '../../api/profiles.js';
import { useSession } from '../../context/SessionContext.jsx';

/* Small list of cities for manual entry.
   Real deployment would use a search API. */
const CITIES = [
  { id: 'nairobi',  label: 'Nairobi, Kenya',       lat: -1.2921, lng: 36.8219 },
  { id: 'mombasa',  label: 'Mombasa, Kenya',       lat: -4.0435, lng: 39.6682 },
  { id: 'kisumu',   label: 'Kisumu, Kenya',        lat: -0.0917, lng: 34.7680 },
  { id: 'nyc',      label: 'New York, USA',        lat: 40.7128, lng: -74.0060 },
  { id: 'la',       label: 'Los Angeles, USA',     lat: 34.0522, lng: -118.2437 },
  { id: 'london',   label: 'London, UK',           lat: 51.5074, lng: -0.1278 },
  { id: 'paris',    label: 'Paris, France',        lat: 48.8566, lng: 2.3522 },
  { id: 'berlin',   label: 'Berlin, Germany',      lat: 52.5200, lng: 13.4050 },
  { id: 'lagos',    label: 'Lagos, Nigeria',       lat: 6.5244, lng: 3.3792 },
  { id: 'joburg',   label: 'Johannesburg, ZA',     lat: -26.2041, lng: 28.0473 },
];

export default function LocationPage() {
  const navigate = useNavigate();
  const { profile, reloadMe } = useSession();

  const [cityId, setCityId] = useState('');
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.location) return;
    const { lat, lng } = profile.location;
    // Match against known cities to pre-select
    const found = CITIES.find(
      (c) => Math.abs(c.lat - lat) < 0.5 && Math.abs(c.lng - lng) < 0.5
    );
    if (found) {
      setCityId(found.id);
      setCoords({ lat, lng });
    } else {
      setCoords({ lat, lng });
    }
  }, [profile]);

  const pickCity = (id) => {
    const c = CITIES.find((x) => x.id === id);
    setCityId(id);
    if (c) setCoords({ lat: c.lat, lng: c.lng });
  };

  const useMyLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      return setError('Location is not available on this device.');
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
        });
        setCityId('');
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError(err.message || 'Could not read your location.');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  };

  const onContinue = async () => {
    setError('');
    if (!coords) return setError('Please choose a location.');

    setSaving(true);
    try {
      await profileApi.update({ location: coords });
      await reloadMe();
      navigate('/discover', { replace: true });
    } catch (e) {
      setError(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingLayout
      step={3}
      title="Where are you?"
      subtitle="We use this to find people near you."
      onContinue={onContinue}
      continueLoading={saving}
      continueDisabled={!coords}
    >
      {error && <p className="onboarding__error" role="alert">{error}</p>}

      <button
        type="button"
        className="location-auto"
        onClick={useMyLocation}
        disabled={locating}
      >
        <FiCrosshair />
        <span>{locating ? 'Locating…' : 'Use my current location'}</span>
      </button>

      <p className="location-or">or pick a city</p>

      <ul className="location-list">
        {CITIES.map((c) => {
          const isOn = cityId === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                className={`location-option ${isOn ? 'is-on' : ''}`}
                onClick={() => pickCity(c.id)}
                aria-pressed={isOn}
              >
                <FiMapPin className="location-option__icon" aria-hidden="true" />
                <span className="location-option__label">{c.label}</span>
                {isOn && <FiCheck className="location-option__check" />}
              </button>
            </li>
          );
        })}
      </ul>

      {coords && (
        <p className="location-selected">
          <FiCheck /> Selected: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
        </p>
      )}
    </OnboardingLayout>
  );
}
