import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiChevronLeft, FiSend, FiMoreVertical, FiAlertCircle } from 'react-icons/fi';
import { FaCheckCircle } from 'react-icons/fa';
import { chatApi, matchApi } from '../api/matches.js';
import { useSession } from '../context/SessionContext.jsx';

export default function ChatThreadPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useSession();

  const [match, setMatch] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const listRef = useRef(null);
  const inputRef = useRef(null);

  /* Load conversation */
  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([
      matchApi.detail(matchId),
      chatApi.conversation(matchId),
    ])
      .then(([detail, conv]) => {
        if (cancelled) return;
        setMatch(detail.match);
        setOtherProfile(detail.otherProfile);
        setMessages(conv?.messages ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || 'Could not load conversation');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [matchId]);

  /* Auto-scroll to bottom */
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (e) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError('');
    try {
      const msg = await chatApi.send(matchId, text);
      setMessages((prev) => [...prev, msg]);
      setDraft('');
      inputRef.current?.focus();
    } catch (err) {
      setError(err.message || 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  const theirPhoto =
    (otherProfile?.photos ?? []).find((p) => p.isPrimary) ??
    (otherProfile?.photos ?? [])[0];
  const theirImage = theirPhoto?.url ?? placeholder(otherProfile?.name || '?');

  return (
    <div className="chat-thread">
      <header className="chat-thread__top">
        <button
          type="button"
          className="chat-thread__back"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <FiChevronLeft />
        </button>

        <Link to={`/profile/${otherProfile?.userId ?? ''}`} className="chat-thread__peer">
          <span className="chat-thread__avatar">
            <img src={theirImage} alt="" />
          </span>
          <span className="chat-thread__peer-info">
            <span className="chat-thread__peer-name">
              {otherProfile?.name || 'Anonymous'}
              {otherProfile?.verified && (
                <FaCheckCircle className="chat-thread__verified" aria-hidden="true" />
              )}
            </span>
            <span className="chat-thread__peer-status">
              {otherProfile?.lastActiveAt
                ? 'Active recently'
                : 'Offline'}
            </span>
          </span>
        </Link>

        <button
          type="button"
          className="chat-thread__more"
          aria-label="More options"
        >
          <FiMoreVertical />
        </button>
      </header>

      <div className="chat-thread__list" ref={listRef}>
        {loading && (
          <p className="chat-thread__loading">Loading messages…</p>
        )}

        {!loading && error && (
          <div className="chat-thread__error">
            <FiAlertCircle />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="chat-thread__empty">
            <p className="chat-thread__empty-title">
              You matched with {otherProfile?.name?.split(' ')[0] || 'someone'}
            </p>
            <p className="chat-thread__empty-sub">
              Say hi to start the conversation.
            </p>
          </div>
        )}

        {messages.map((m) => {
          const isMe = m.senderId === user?.id;
          return (
            <div
              key={m.id}
              className={`chat-msg ${isMe ? 'chat-msg--me' : 'chat-msg--them'}`}
            >
              <div className="chat-msg__bubble">
                <p className="chat-msg__text">{m.body}</p>
                <span className="chat-msg__meta">
                  <span className="chat-msg__time">
                    {formatTime(m.createdAt)}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <form className="chat-thread__input" onSubmit={send}>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          aria-label="Message"
          disabled={sending}
        />

        <button
          type="submit"
          className="chat-thread__send"
          aria-label="Send"
          disabled={!draft.trim() || sending}
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
}

function formatTime(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function placeholder(name) {
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FFE5EA"/>
          <stop offset="1" stop-color="#FFB7C3"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#g)"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
            fill="#E62E4E" font-family="Inter, sans-serif" font-weight="800"
            font-size="80">${initials}</text>
    </svg>`.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
