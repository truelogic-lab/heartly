import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiCheck } from 'react-icons/fi';

const LANGS = [
  { code: 'en', label: 'English',    sub: 'United States' },
  { code: 'sw', label: 'Kiswahili',  sub: 'Kenya' },
  { code: 'fr', label: 'Français',   sub: 'France' },
  { code: 'es', label: 'Español',    sub: 'Spain' },
  { code: 'de', label: 'Deutsch',    sub: 'Germany' },
  { code: 'pt', label: 'Português',  sub: 'Brazil' },
];

export default function LanguagePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('en');

  return (
    <section className="subpage">
      <header className="subpage__top">
        <button type="button" className="subpage__back" aria-label="Back" onClick={() => navigate(-1)}>
          <FiChevronLeft />
        </button>
        <h1 className="subpage__title">Language</h1>
        <span className="subpage__spacer" />
      </header>

      <div className="subpage__body">
        <p className="subpage__lead">Choose the language you want Heartly to use.</p>

        <ul className="lang-list">
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                className={`lang-item ${selected === l.code ? 'is-selected' : ''}`}
                onClick={() => setSelected(l.code)}
              >
                <div className="lang-item__text">
                  <span className="lang-item__label">{l.label}</span>
                  <span className="lang-item__sub">{l.sub}</span>
                </div>
                {selected === l.code && <FiCheck className="lang-item__check" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
