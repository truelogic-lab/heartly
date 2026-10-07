import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ActivityEngine } from '../domain/ActivityEngine.js';
import { ProfileEngine } from '../domain/ProfileEngine.js';
import { ManualClock } from '../core/clock.js';
import { ACTIVITY_STATE } from '../core/constants.js';

const NOW = Date.UTC(2025, 5, 15);

function makeActivity() {
  const clock = new ManualClock(NOW);
  const profileEngine = new ProfileEngine({ clock });
  return { activity: new ActivityEngine({ profileEngine }), clock };
}

function profile(id, lastActiveAt) {
  return { id, lastActiveAt };
}

test('partition: groups profiles by activity state', () => {
  const { activity } = makeActivity();
  const parts = activity.partition([
    profile('a', NOW - 60_000),                    // online
    profile('b', NOW - 30 * 60_000),               // recently active
    profile('c', NOW - 3 * 24 * 60 * 60_000),      // active today
    profile('d', NOW - 30 * 24 * 60 * 60_000),     // inactive
    profile('e'),                                  // inactive (no timestamp)
  ]);
  assert.equal(parts[ACTIVITY_STATE.ONLINE].length, 1);
  assert.equal(parts[ACTIVITY_STATE.RECENTLY_ACTIVE].length, 1);
  assert.equal(parts[ACTIVITY_STATE.ACTIVE_TODAY].length, 1);
  assert.equal(parts[ACTIVITY_STATE.INACTIVE].length, 2);
});

test('onlineIds: returns ids of online profiles', () => {
  const { activity } = makeActivity();
  const ids = activity.onlineIds([
    profile('a', NOW - 30_000),
    profile('b', NOW - 10 * 60_000),
  ]);
  assert.deepEqual(ids, ['a']);
});

test('onlineCount: returns number of online profiles', () => {
  const { activity } = makeActivity();
  const count = activity.onlineCount([
    profile('a', NOW - 30_000),
    profile('b', NOW - 60_000),
    profile('c', NOW - 10 * 60_000),
  ]);
  assert.equal(count, 2);
});

test('sortByRecency: most recent first', () => {
  const { activity } = makeActivity();
  const sorted = activity.sortByRecency([
    profile('old', NOW - 30 * 24 * 60 * 60_000),
    profile('new', NOW - 5_000),
    profile('mid', NOW - 30 * 60_000),
  ]);
  assert.deepEqual(sorted.map((p) => p.id), ['new', 'mid', 'old']);
});

test('pulse: aggregates totals', () => {
  const { activity } = makeActivity();
  const p = activity.pulse([
    profile('a', NOW - 30_000), // online
    profile('b', NOW - 60_000), // online
    profile('c', NOW - 30 * 60_000), // recently active
    profile('d', NOW - 30 * 24 * 60 * 60_000), // inactive
  ]);
  assert.equal(p.online, 2);
  assert.equal(p.recentlyActive, 1);
  assert.equal(p.activeToday, 0);
  assert.equal(p.inactive, 1);
  assert.equal(p.total, 4);
});

test('empty input returns empty output', () => {
  const { activity } = makeActivity();
  assert.deepEqual(activity.onlineIds([]), []);
  assert.equal(activity.onlineCount([]), 0);
  assert.deepEqual(activity.sortByRecency([]), []);
  assert.equal(activity.pulse([]).total, 0);
});
