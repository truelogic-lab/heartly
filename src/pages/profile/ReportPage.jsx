import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FiChevronLeft, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { safetyApi } from '../../api/safety.js';

const REASONS = [
  { id: 'spam',       label: 'Spam or scam',           desc: 'Suspicious links, fake offers, requests for money' },
  { id: 'harassment', label: 'Harassment',             desc: 'Abusive messages, threats, unwanted contact' },
  { id: 'fake',       label: 'Fake profile',           desc: 'Someone pretending to be another person' },
  { id: 'inappropriate', label: 'Inappropriate content', desc: 'Nudity, violence, or offensive material' },
  { id: 'underage',   label: 'Underage user',          desc: 'Someone who appears to be under 18' },
  { id: 'other',      label: 'Something else',         desc: 'A different concern' },
];

export default function ReportPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const userId = params.get('userId');

  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setError('');
    if (!reason) return setError('Please pick a reason.');
    if (!userId) return setError('Missing user id.');

    setSubmitting(true);
    try {
      const fullReason = details.trim()
        ? `${reason}: ${details.trim()}`
        : reason;
      await safetyApi.report(userId, fullReason, alsoBlock);
      setDone(true);
    } catch (e) {
      setError(e.message || 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
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
          <h1 className="subpage__title">Report</h1>
          <span className="subpage__spacer" />
        </header>

        <div className="subpage__body">
          <div className="report-success">
            <span className="report-success__icon"><FiCheck /></span>
            <h2>Report submitted</h2>
            <p>Thanks. Our team reviews every report within 24 hours.</p>
            <button
              type="button"
              className="report-success__cta"
              onClick={() => navigate('/discover', { replace: true })}
            >
              Back to Discover
            </button>
          </div>
        </div>
      </section>
    );
  }

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
        <h1 className="subpage__title">Report</h1>
        <span className="subpage__spacer" />
      </header>

      <div className="subpage__body">
        <div className="report-banner">
          <span className="report-banner__icon"><FiAlertTriangle /></span>
          <div>
            <p className="report-banner__title">Report a user</p>
            <p className="report-banner__sub">
              Reports are confidential. The user is never told who reported them.
            </p>
          </div>
        </div>

        {error && <p className="subpage__error">{error}</p>}

        <div className="subpage__section-title">Why are you reporting this user?</div>

        <ul className="report-reasons">
          {REASONS.map((r) => {
            const isOn = reason === r.id;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  className={`report-reason ${isOn ? 'is-on' : ''}`}
                  onClick={() => setReason(r.id)}
                >
                  <span className="report-reason__radio" />
                  <span className="report-reason__text">
                    <span className="report-reason__label">{r.label}</span>
                    <span className="report-reason__desc">{r.desc}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <label className="report-details">
          <span>Additional details (optional)</span>
          <textarea
            rows={3}
            maxLength={400}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Anything else we should know…"
          />
        </label>

        <label className="report-check">
          <input
            type="checkbox"
            checked={alsoBlock}
            onChange={(e) => setAlsoBlock(e.target.checked)}
          />
          <span>Also block this user so they can&apos;t contact you</span>
        </label>

        <button
          type="button"
          className="report-submit"
          onClick={onSubmit}
          disabled={submitting || !reason}
        >
          {submitting ? 'Submitting…' : 'Submit report'}
        </button>

        <Link to="/profile/privacy" className="subpage__back-link">
          Back to Privacy & Safety
        </Link>
      </div>
    </section>
  );
}
