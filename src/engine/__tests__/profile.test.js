import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ProfileEngine } from '../domain/ProfileEngine.js';
import { ManualClock } from '../core/clock.js';
import { ACTIVITY, ACTIVITY_STATE } from '../core/constants.js';

const NOW = Date.UTC(2025, 5, 15);

function profile(overrides = {}) {
  return {
    id: 'p1',
    name: 'Sophie',
    bio: 'Photographer based in NYC.',
    birthdate: Date.UTC(1998, 4, 14),
    gender: 'woman',
    location: { lat: 40.7, lng: -74.0 },
    photos: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }],
    interests: ['travel', 'music', 'coffee'],
    prompts: [{}, {}, {}],
    verified: true,
    lastActiveAt: NOW - 60_000, // 1 min ago
    ...overrides,
  };
}

test('completeness: full profile returns 100', () => {
  const clock = new ManualClock(NOW);
  const engine = new ProfileEngine({ clock });
  assert.equal(engine.completeness(profile()), 100);
});

test('completeness: empty profile returns 0', () => {
  const clock = new ManualClock(NOW);
  const engine = new ProfileEngine({ clock });
  assert.equal(engine.completeness({}), 0);
  assert.equal(engine.completeness(null), 0);
});

test('completeness: missing bio reduces score', () => {
  const clock = new ManualClock(NOW);
  const engine = new ProfileEngine({ clock });
  const full = engine.completeness(profile());
  const noBio = engine.completeness(profile({ bio: '' }));
  assert.ok(noBio < full);
});

test('quality: verified + complete beats sparse', () => {
  const clock = new ManualClock(NOW);
  const engine = new ProfileEngine({ clock });
  const qFull = engine.quality(profile());
  const qSparse = engine.quality({ id: 'x', name: 'Sam' });
  assert.ok(qFull > qSparse);
  assert.ok(qFull >= 0 && qFull <= 1);
  assert.ok(qSparse >= 0 && qSparse <= 1);
});

test('activity: online when active within 5 minutes', () => {
  const clock = new ManualClock(NOW);
  const engine = new ProfileEngine({ clock });
  const p = profile({ lastActiveAt: NOW - 60_000 });
  assert.equal(engine.activityState(p), ACTIVITY_STATE.ONLINE);
  assert.equal(engine.isOnline(p), true);
});

test('activity: recently active within 1 hour', () => {
  const clock = new ManualClock(NOW);
  const engine = new ProfileEngine({ clock });
  const p = profile({ lastActiveAt: NOW - 30 * 60_000 });
  assert.equal(engine.activityState(p), ACTIVITY_STATE.RECENTLY_ACTIVE);
});

test('activity: active today within 7 days', () => {
  const clock = new ManualClock(NOW);
  const engine = new ProfileEngine({ clock });
  const p = profile({ lastActiveAt: NOW - 3 * 24 * 60 * 60_000 });
  assert.equal(engine.activityState(p), ACTIVITY_STATE.ACTIVE_TODAY);
});

test('activity: inactive past 7 days', () => {
  const clock = new ManualClock(NOW);
  const engine = new ProfileEngine({ clock });
  const p = profile({ lastActiveAt: NOW - 30 * 24 * 60 * 60_000 });
  assert.equal(engine.activityState(p), ACTIVITY_STATE.INACTIVE);
  assert.equal(engine.isInactive(p), true);
});

test('recencyScore: 1 for just-now, 0 for stale', () => {
  const clock = new ManualClock(NOW);
  const engine = new ProfileEngine({ clock });
  assert.equal(engine.recencyScore(profile({ lastActiveAt: NOW })), 1);
  assert.equal(engine.recencyScore({}), 0);
  const older = engine.recencyScore({ lastActiveAt: NOW - ACTIVITY.INACTIVE_WINDOW_MS * 2 });
  assert.equal(older, 0);
});
