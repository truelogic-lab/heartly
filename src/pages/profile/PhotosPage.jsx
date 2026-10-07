import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiCamera, FiTrash2, FiStar, FiChevronLeft as FiLeft, FiChevronRight } from 'react-icons/fi';
import { photoApi } from '../../api/photos.js';
import { useSession } from '../../context/SessionContext.jsx';

const MAX_PHOTOS = 6;

export default function PhotosPage() {
  const navigate = useNavigate();
  const { profile, reloadMe } = useSession();

  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const fileRef = useRef(null);

  /* Load from session profile */
  useEffect(() => {
    const list = (profile?.photos ?? []).slice().sort((a, b) => a.order - b.order);
    setPhotos(list);
  }, [profile]);

  const onAdd = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      await photoApi.upload(file);
      await reloadMe();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this photo?')) return;
    setError('');
    setBusyId(id);
    try {
      await photoApi.remove(id);
      await reloadMe();
    } catch (e) {
      setError(e.message || 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  const onSetPrimary = async (id) => {
    setError('');
    setBusyId(id);
    try {
      await photoApi.setPrimary(id);
      await reloadMe();
    } catch (e) {
      setError(e.message || 'Could not set primary');
    } finally {
      setBusyId(null);
    }
  };

  const onMove = async (id, dir) => {
    const idx = photos.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const target = idx + dir;
    if (target < 0 || target >= photos.length) return;

    const next = [...photos];
    [next[idx], next[target]] = [next[target], next[idx]];
    setPhotos(next);

    try {
      await photoApi.reorder(next.map((p) => p.id));
      await reloadMe();
    } catch (e) {
      setError(e.message || 'Reorder failed');
    }
  };

  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i] ?? null);
  const canAdd = photos.length < MAX_PHOTOS;

  return (
    <section className="photos-page">
      <header className="photos-page__top">
        <button
          type="button"
          className="photos-page__back"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <FiChevronLeft />
        </button>
        <h1 className="photos-page__title">Your photos</h1>
        <span className="photos-page__spacer" />
      </header>

      <div className="photos-page__body">
        <p className="photos-page__lead">
          Add up to {MAX_PHOTOS} photos. The first one is your main profile picture.
        </p>

        {error && <p className="photos-page__error" role="alert">{error}</p>}

        <div className="photos-grid">
          {slots.map((photo, index) => (
            <div
              key={photo?.id ?? `empty-${index}`}
              className={`photo-slot ${photo ? 'has-photo' : 'is-empty'} ${
                photo?.isPrimary ? 'is-primary' : ''
              }`}
            >
              {photo ? (
                <>
                  <img src={photo.url} alt="" loading="lazy" />

                  {photo.isPrimary && (
                    <span className="photo-slot__primary">
                      <FiStar /> Main
                    </span>
                  )}

                  <div className="photo-slot__actions">
                    {!photo.isPrimary && (
                      <button
                        type="button"
                        className="photo-slot__btn"
                        aria-label="Set as main"
                        disabled={busyId === photo.id}
                        onClick={() => onSetPrimary(photo.id)}
                      >
                        <FiStar />
                      </button>
                    )}

                    {index > 0 && (
                      <button
                        type="button"
                        className="photo-slot__btn"
                        aria-label="Move left"
                        onClick={() => onMove(photo.id, -1)}
                      >
                        <FiLeft />
                      </button>
                    )}

                    {index < photos.length - 1 && (
                      <button
                        type="button"
                        className="photo-slot__btn"
                        aria-label="Move right"
                        onClick={() => onMove(photo.id, 1)}
                      >
                        <FiChevronRight />
                      </button>
                    )}

                    <button
                      type="button"
                      className="photo-slot__btn photo-slot__btn--danger"
                      aria-label="Delete"
                      disabled={busyId === photo.id}
                      onClick={() => onDelete(photo.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </>
              ) : index === photos.length && canAdd ? (
                <>
                  <button
                    type="button"
                    className="photo-slot__add"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    aria-label="Add photo"
                  >
                    <FiCamera />
                    <span>{uploading ? 'Uploading…' : 'Add photo'}</span>
                  </button>
                  <span className="photo-slot__hint">
                    {index === 0 ? 'Main' : `Photo ${index + 1}`}
                  </span>
                </>
              ) : (
                <div className="photo-slot__placeholder">
                  <span className="photo-slot__placeholder-num">{index + 1}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={onAdd}
        />

        <div className="photos-page__tips">
          <p className="photos-page__tips-title">Photo tips</p>
          <ul className="photos-page__tips-list">
            <li>Clear face, no sunglasses</li>
            <li>Good lighting, natural colors</li>
            <li>Show your interests — hiking, coffee, friends</li>
            <li>No group photos as your main</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
