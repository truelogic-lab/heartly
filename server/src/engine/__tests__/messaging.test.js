import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MessagingEngine } from '../domain/MessagingEngine.js';
import { ManualClock } from '../core/clock.js';
import { MESSAGE_LIMITS } from '../core/constants.js';

const NOW = Date.UTC(2025, 5, 15);

function makeMessaging() {
  const clock = new ManualClock(NOW);
  return { messaging: new MessagingEngine({ clock }), clock };
}

function matchOf(over = {}) {
  return { id: 'm1', users: ['a', 'b'], blocked: false, deleted: false, ...over };
}

test('canSend: matched users can message', () => {
  const { messaging } = makeMessaging();
  const r = messaging.canSendMessage({ senderId: 'a', match: matchOf() });
  assert.equal(r.allowed, true);
});

test('canSend: non-participant cannot message', () => {
  const { messaging } = makeMessaging();
  const r = messaging.canSendMessage({ senderId: 'c', match: matchOf() });
  assert.equal(r.allowed, false);
  assert.equal(r.code, 'NOT_MATCHED');
});

test('canSend: no match object → denied', () => {
  const { messaging } = makeMessaging();
  const r = messaging.canSendMessage({ senderId: 'a', match: null });
  assert.equal(r.allowed, false);
  assert.equal(r.code, 'NOT_MATCHED');
});

test('canSend: blocked match → denied', () => {
  const { messaging } = makeMessaging();
  const r = messaging.canSendMessage({ senderId: 'a', match: matchOf({ blocked: true }) });
  assert.equal(r.allowed, false);
  assert.equal(r.code, 'USER_BLOCKED');
});

test('canSend: deleted match → denied', () => {
  const { messaging } = makeMessaging();
  const r = messaging.canSendMessage({ senderId: 'a', match: matchOf({ deleted: true }) });
  assert.equal(r.allowed, false);
  assert.equal(r.code, 'NOT_MATCHED');
});

test('canSend: blockedEitherDirection → denied', () => {
  const { messaging } = makeMessaging();
  const r = messaging.canSendMessage({
    senderId: 'a',
    match: matchOf(),
    blockedEitherDirection: true,
  });
  assert.equal(r.allowed, false);
  assert.equal(r.code, 'USER_BLOCKED');
});

test('prepare: rejects empty', () => {
  const { messaging } = makeMessaging();
  assert.throws(() => messaging.prepare({ matchId: 'm1', senderId: 'a', body: '   ' }), /cannot be empty/i);
  assert.throws(() => messaging.prepare({ matchId: 'm1', senderId: 'a', body: '' }), /cannot be empty/i);
});

test('prepare: rejects non-string', () => {
  const { messaging } = makeMessaging();
  assert.throws(() => messaging.prepare({ matchId: 'm1', senderId: 'a', body: 42 }), /string/i);
});

test('prepare: rejects too long', () => {
  const { messaging } = makeMessaging();
  const big = 'x'.repeat(MESSAGE_LIMITS.MAX_LENGTH + 1);
  assert.throws(() => messaging.prepare({ matchId: 'm1', senderId: 'a', body: big }), /at most/i);
});

test('prepare: trims and stamps with clock time', () => {
  const { messaging, clock } = makeMessaging();
  clock.tick(1000);
  const m = messaging.prepare({ matchId: 'm1', senderId: 'a', body: '  hello  ' });
  assert.equal(m.body, 'hello');
  assert.equal(m.createdAt, NOW + 1000);
  assert.equal(m.matchId, 'm1');
  assert.equal(m.senderId, 'a');
});

test('sortConversation: chronological', () => {
  const { messaging } = makeMessaging();
  const sorted = messaging.sortConversation([
    { id: 3, createdAt: 300 },
    { id: 1, createdAt: 100 },
    { id: 2, createdAt: 200 },
  ]);
  assert.deepEqual(sorted.map((m) => m.id), [1, 2, 3]);
});

test('sortConversation: stable for equal timestamps', () => {
  const { messaging } = makeMessaging();
  const sorted = messaging.sortConversation([
    { id: 'a', createdAt: 100 },
    { id: 'b', createdAt: 100 },
    { id: 'c', createdAt: 100 },
  ]);
  assert.deepEqual(sorted.map((m) => m.id), ['a', 'b', 'c']);
});

test('preview: truncates long text', () => {
  const { messaging } = makeMessaging();
  const long = 'a'.repeat(200);
  const p = messaging.preview({ body: long }, 20);
  assert.ok(p.length <= 20);
  assert.ok(p.endsWith('…'));
});
