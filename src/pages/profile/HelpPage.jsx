import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronDown, FiMail, FiMessageSquare, FiBookOpen } from 'react-icons/fi';

const FAQ = [
  { q: 'How do I change my photos?', a: 'Go to your Profile, tap the camera icon on your avatar, and pick a new image.' },
  { q: 'How do matches work?', a: 'When both you and another person like each other, it becomes a match. You can then chat freely.' },
  { q: 'Can I undo a swipe?', a: 'Yes. Tap the rewind button on the Swipe screen to go back to the previous profile.' },
  { q: 'How do I report a user?', a: 'Open their profile, tap the ⋮ menu, then Report. Our team reviews all reports within 24 hours.' },
  { q: 'How do I delete my account?', a: 'Go to Settings → Danger zone → Deactivate account. This is reversible by signing back in.' },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);

  return (
    <section className="subpage">
      <header className="subpage__top">
        <button type="button" className="subpage__back" aria-label="Back" onClick={() => navigate(-1)}>
          <FiChevronLeft />
        </button>
        <h1 className="subpage__title">Help & Support</h1>
        <span className="subpage__spacer" />
      </header>

      <div className="subpage__body">
        <p className="subpage__lead">Find answers or reach out to our team.</p>

        <div className="help-actions">
          <a href="#chat" className="help-action">
            <span className="help-action__icon"><FiMessageSquare /></span>
            <span className="help-action__label">Live chat</span>
          </a>
          <a href="mailto:help@heartly.app" className="help-action">
            <span className="help-action__icon"><FiMail /></span>
            <span className="help-action__label">Email us</span>
          </a>
          <a href="#guide" className="help-action">
            <span className="help-action__icon"><FiBookOpen /></span>
            <span className="help-action__label">Guides</span>
          </a>
        </div>

        <h2 className="subpage__section-title">Frequently asked</h2>

        <ul className="faq-list">
          {FAQ.map((item, i) => (
            <li key={i} className={`faq-item ${open === i ? 'is-open' : ''}`}>
              <button
                type="button"
                className="faq-item__q"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span>{item.q}</span>
                <FiChevronDown className={`faq-item__chev ${open === i ? 'is-open' : ''}`} />
              </button>
              {open === i && <p className="faq-item__a">{item.a}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
