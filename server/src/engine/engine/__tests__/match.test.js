import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MatchEngine } from '../domain/MatchEngine.js';
import { ManualClock } from '../core/clock.js';
import { EVENTS } from '../core/constants.js';

const NOW = Date.UTC(2025, 5, 15);

function makeMatch() {
  const clock = new ManualClock(NOW);
  return { match: new MatchEngine({ clock }), clock };
}

test('pairId: order-independent', () => {
  const { match } = makeMatch();
  const a = match.pairId('user_1', 'user_2');
  const b = match.pairId('user_2', 'user_1');
  assert.equal(a, b);
  assert.ok(a.startsWith('match_'));
});

test('evaluate: mutual like creates a match', () => {
  const { match } = makeMatch();
  const r = match.evaluate({ viewerId: 'a', targetId: 'b', targetLikedViewer: true });
  assert.equal(r.matched, true);
  assert.ok(r.matchId);
  assert.equal(r.event.type, EVENTS.MATCH_CREATED);
  assert.equal(r.event.createdAt, NOW);
  assert.deepEqual(r.event.users, ['a', 'b']);
});

test('evaluate: one-sided like does NOT create a match', () => {
  const { match } = makeMatch();
  const r = match.evaluate({ viewerId: 'a', targetId: 'b', targetLikedViewer: false });
  assert.equal(r.matched, false);
  assert.equal(r.reason, 'ONE_SIDED');
});

test('evaluate: self-match is denied', () => {
  const { match } = makeMatch();
  const r = match.evaluate({ viewerId: 'a', targetId: 'a', targetLikedViewer: true });
  assert.equal(r.matched, false);
  assert.equal(r.reason, 'SELF_ACTION');
});

test('evaluate: duplicate match is prevented', () => {
  const { match } = makeMatch();
  const r = match.evaluate({
    viewerId: 'a',
    targetId: 'b',
    targetLikedViewer: true,
    alreadyMatched: true,
  });
  assert.equal(r.matched, false);
  assert.equal(r.reason, 'DUPLICATE_MATCH');
});

test('otherUser: returns the other participant', () => {
  const { match } = makeMatch();
  const record = { users: ['a', 'b'] };
  assert.equal(match.otherUser(record, 'a'), 'b');
  assert.equal(match.otherUser(record, 'b'), 'a');
  assert.equal(match.otherUser(record, 'c'), null);
  assert.equal(match.otherUser(null, 'a'), null);
});

test('includes: correctly checks participation', () => {
  const { match } = makeMatch();
  const record = { users: ['a', 'b'] };
  assert.equal(match.includes(record, 'a'), true);
  assert.equal(match.includes(record, 'c'), false);
  assert.equal(match.includes(null, 'a'), false);
});
