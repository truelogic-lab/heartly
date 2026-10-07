import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUser, FiTag, FiSettings, FiGlobe, FiBell, FiShield,
  FiHelpCircle, FiLogOut, FiChevronRight, FiChevronLeft,
  FiEdit2, FiCheck, FiCamera,
} from 'react-icons/fi';
import { FaHeart, FaCheckCircle } from 'react-icons/fa';
import { HiOutlineHeart } from 'react-icons/hi2';
import { profileApi } from '../api/profiles.js';
import { uploadAvatar } from '../api/upload.js';
import { getAccessToken } from '../api/client.js';
import { useSession } from '../context/SessionContext.jsx';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, logout, reloadMe } = useSession();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  /* Sync form state whenever the profile from context changes */
  useEffect(() => {
    setName(profile?.name ?? user?.name ?? '');
    setBio(profile?.bio ?? '');
  }, [profile, user]);

  const onSave = async () => {
    setError('');
    setSaving(true);
    try {
      const updated = await profileApi.update({
        name: name.trim(),
        bio: bio.trim(),
      });
      await reloadMe();
      if (updated?.bio !== undefined) setBio(updated.bio ?? '');
      if (updated?.name !== undefined) setName(updated.name ?? '');
      setEditing(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (e) {
      setError(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      await uploadAvatar(file, getAccessToken());
      await reloadMe();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onSignOut = async () => {
    if (!confirm('Sign out of Heartly?')) return;
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = (profile?.name ?? user?.name ?? '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const age = ageOf(profile?.birthdate);
  const interestCount = (profile?.interests ?? []).length;
  const bioText = (profile?.bio ?? '').trim();

  const primaryPhoto =
    (profile?.photos ?? []).find((p) => p.isPrimary) ??
    (profile?.photos ?? [])[0];
  const avatarUrl = primaryPhoto?.url ?? null;

  return (
    <div className="profile-page">
      {/* Red header with avatar */}
      <header className="profile-head">
        <div className="profile-head__bg" aria-hidden="true" />

        <button
          type="button"
          className="profile-head__back"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <FiChevronLeft />
        </button>

        <div className="profile-head__inner">
          <div className="profile-head__avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <span className="profile-head__initials">{initials}</span>
            )}

            <label
              className="profile-head__upload"
              aria-label="Change photo"
              title="Change photo"
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={onAvatarChange}
                disabled={uploading}
              />
              {uploading ? <Spinner /> : <FiCamera />}
            </label>

            {profile?.verified && (
              <span className="profile-head__verified" aria-label="Verified">
                <FaCheckCircle />
              </span>
            )}
          </div>

          <h1 className="profile-head__name">
            {profile?.name ?? user?.name ?? 'You'}
            {age != null && `, ${age}`}
          </h1>

          <p className="profile-head__location">
            {profile?.location
              ? `${profile.location.lat?.toFixed(2)}, ${profile.location.lng?.toFixed(2)}`
              : 'Location not set'}
          </p>
        </div>
      </header>

      <div className="profile-body">
        {/* Edit toggle */}
        <div className="profile-edit-row">
          {!editing ? (
            <button
              type="button"
              className="profile-edit-btn"
              onClick={() => setEditing(true)}
            >
              <FiEdit2 /> Edit profile
            </button>
          ) : (
            <div className="profile-edit-actions">
              <button
                type="button"
                className="profile-edit-btn profile-edit-btn--ghost"
                onClick={() => {
                  setEditing(false);
                  setName(profile?.name ?? '');
                  setBio(profile?.bio ?? '');
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="profile-edit-btn profile-edit-btn--primary"
                onClick={onSave}
                disabled={saving}
              >
                <FiCheck /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {error && <p className="profile-error" role="alert">{error}</p>}
        {savedFlash && (
          <p className="profile-saved" role="status">Saved ✓</p>
        )}

        {/* Name + Bio */}
        {editing ? (
          <div className="profile-section">
            <label className="profile-field">
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={60}
              />
            </label>

            <label className="profile-field">
              <span>Bio</span>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                placeholder="Tell people about you…"
              />
              <small className="profile-field__counter">
                {bio.length} / 500
              </small>
            </label>
          </div>
        ) : (
          <div className="profile-section">
            {bioText ? (
              <p className="profile-bio">{bioText}</p>
            ) : (
              <p className="profile-bio profile-bio--empty">
                No bio yet. Tap &ldquo;Edit profile&rdquo; to add one.
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat__value">{interestCount}</span>
            <span className="profile-stat__label">Interests</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__value">
              {profile?.photos?.length ?? 0}
            </span>
            <span className="profile-stat__label">Photos</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__value">
              {profile?.verified ? 'Yes' : 'No'}
            </span>
            <span className="profile-stat__label">Verified</span>
          </div>
        </div>

        {/* Menu */}
        <ul className="profile-menu">
          <li>
            <Link to="/profile/photos" className="profile-menu__item">
              <span className="profile-menu__icon"><FiCamera /></span>
              <span className="profile-menu__label">Photos</span>
              <span className="profile-menu__value">{profile?.photos?.length ?? 0} of 6</span>
              <FiChevronRight className="profile-menu__chev" />
            </Link>
          </li>

          <li>
            <Link to="/interests" className="profile-menu__item">
              <span className="profile-menu__icon"><FiTag /></span>
              <span className="profile-menu__label">Interests</span>
              <span className="profile-menu__value">{interestCount} selected</span>
              <FiChevronRight className="profile-menu__chev" />
            </Link>
          </li>

          <li>
            <Link to="/requests" className="profile-menu__item">
              <span className="profile-menu__icon"><FaHeart /></span>
              <span className="profile-menu__label">Requests</span>
              <FiChevronRight className="profile-menu__chev" />
            </Link>
          </li>

          <li>
            <Link to="/profile/settings" className="profile-menu__item">
              <span className="profile-menu__icon"><FiSettings /></span>
              <span className="profile-menu__label">Settings</span>
              <FiChevronRight className="profile-menu__chev" />
            </Link>
          </li>

          <li>
            <Link to="/profile/language" className="profile-menu__item">
              <span className="profile-menu__icon"><FiGlobe /></span>
              <span className="profile-menu__label">Language</span>
              <span className="profile-menu__value">English</span>
              <FiChevronRight className="profile-menu__chev" />
            </Link>
          </li>

          <li>
            <Link to="/profile/notifications" className="profile-menu__item">
              <span className="profile-menu__icon"><FiBell /></span>
              <span className="profile-menu__label">Notifications</span>
              <FiChevronRight className="profile-menu__chev" />
            </Link>
          </li>

          <li>
            <Link to="/profile/privacy" className="profile-menu__item">
              <span className="profile-menu__icon"><FiShield /></span>
              <span className="profile-menu__label">Privacy &amp; Safety</span>
              <FiChevronRight className="profile-menu__chev" />
            </Link>
          </li>

          <li>
            <Link to="/profile/help" className="profile-menu__item">
              <span className="profile-menu__icon"><FiHelpCircle /></span>
              <span className="profile-menu__label">Help &amp; Support</span>
              <FiChevronRight className="profile-menu__chev" />
            </Link>
          </li>
        </ul>

        {/* Boost card */}
        <div className="profile-boost">
          <div className="profile-boost__icon" aria-hidden="true">
            <HiOutlineHeart />
          </div>
          <div className="profile-boost__text">
            <p className="profile-boost__title">Get more matches</p>
            <p className="profile-boost__sub">
              Complete your profile to stand out.
            </p>
          </div>
          <Link to="/interests" className="profile-boost__cta">
            Complete
          </Link>
        </div>

        {/* Sign out */}
        <button
          type="button"
          className="profile-signout"
          onClick={onSignOut}
        >
          <FiLogOut />
          <span>Sign Out</span>
        </button>

        <p className="profile-email">{user?.email}</p>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function ageOf(birthdate) {
  if (!birthdate) return null;
  const ms = typeof birthdate === 'bigint' ? Number(birthdate) : Number(birthdate);
  if (!ms) return null;
  const d = new Date(ms);
  const n = new Date();
  let age = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) age--;
  return age;
}

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#fff',
        animation: 'spin 0.9s linear infinite',
      }}
      aria-hidden="true"
    />
  );
}
