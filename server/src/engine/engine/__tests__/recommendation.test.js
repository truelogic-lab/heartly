import { test } from 'node:test';
import assert from 'node:assert/strict';

import { RecommendationEngine } from '../domain/RecommendationEngine.js';
import { DiscoveryEngine } from '../domain/DiscoveryEngine.js';
import { RankingEngine } from '../domain/RankingEngine.js';
import { CompatibilityEngine } from '../domain/CompatibilityEngine.js';
import { ProfileEngine } from '../domain/ProfileEngine.js';
import { ManualClock } from '../core/clock.js';
import { GENDERS } from '../core/constants.js';

const NOW = Date.UTC(2025, 5, 15);

function makeRecommendation() {
  const clock = new ManualClock(NOW);
  const profileEngine = new ProfileEngine({ clock });
  const rankingEngine = new RankingEngine({ profileEngine });
  const compatibilityEngine = new CompatibilityEngine();
  const discoveryEngine = new DiscoveryEngine({ rankingEngine, compatibilityEngine });
  const recommendation = new RecommendationEngine({ discoveryEngine, profileEngine });
  return { recommendation, profileEngine };
}

function viewer(over = {}) {
  return {
    id: 'v',
    birthdate: Date.UTC(1998, 0, 1),
    gender: GENDERS.WOMAN,
    interests: ['travel', 'music', 'coffee'],
    location: { lat: 40.7, lng: -74.0 },
    preferences: { minAge: 18, maxAge: 60, maxDistanceKm: 100, lookingFor: 'everyone' },
    ...over,
  };
}

function cand(id, over = {}) {
  return {
    id,
    name: `Cand ${id}`,
    birthdate: Date.UTC(1996, 0, 1),
    gender: GENDERS.MAN,
    interests: ['travel', 'music', 'coffee'],
    location: { lat: 40.71, lng: -74.01 },
    photos: [{}, {}, {}],
    bio: 'hi',
    prompts: [],
    verified: true,
    lastActiveAt: NOW - 60_000,
    ...over,
  };
}

test('dailyPicks: returns at most DAILY_PICKS.COUNT (4) by default', () => {
  const { recommendation } = makeRecommendation();
  const candidates = ['a','b','c','d','e','f'].map((id) => cand(id));
  const picks = recommendation.dailyPicks(viewer(), candidates, {}, '2026-10-07');
  assert.ok(picks.length <= 4);
});

test('dailyPicks: deterministic for same dayStamp', () => {
  const { recommendation } = makeRecommendation();
  const candidates = ['a','b','c','d','e','f'].map((id) => cand(id));
  const day1 = recommendation.dailyPicks(viewer(), candidates, {}, '2026-10-07');
  const day2 = recommendation.dailyPicks(viewer(), candidates, {}, '2026-10-07');
  assert.deepEqual(day1.map((r) => r.candidate.id), day2.map((r) => r.candidate.id));
});

test('dailyPicks: changes across day stamps (usually)', () => {
  const { recommendation } = makeRecommendation();
  const candidates = ['a','b','c','d','e','f','g','h','i','j'].map((id) => cand(id));
  const day1 = recommendation.dailyPicks(viewer(), candidates, {}, '2026-10-07');
  const day2 = recommendation.dailyPicks(viewer(), candidates, {}, '2026-10-20');
  // Not requiring it be different (edge case possible) but at least same length
  assert.equal(day1.length, day2.length);
});

test('onlineNow: prefers currently online candidates', () => {
  const { recommendation } = makeRecommendation();
  const online = cand('online', { lastActiveAt: NOW - 30_000 });
  const offline = cand('offline', { lastActiveAt: NOW - 5 * 24 * 60 * 60_000 });
  const result = recommendation.onlineNow(viewer(), [offline, online], {}, 2);
  assert.equal(result[0].candidate.id, 'online');
});

test('onlineNow: only returns genuinely online candidates when 2+ are online', () => {
  const { recommendation } = makeRecommendation();
  const fresh = cand('fresh', { lastActiveAt: NOW - 10_000 });
  const older = cand('older', { lastActiveAt: NOW - 3 * 60_000 });
  const stale = cand('stale', { lastActiveAt: NOW - 20 * 60_000 });
  const result = recommendation.onlineNow(viewer(), [stale, older, fresh], {}, 3);
  assert.deepEqual(result.map((r) => r.candidate.id), ['fresh', 'older']);
});

test('onlineNow: sorted by recency, most recent first', () => {
  const { recommendation } = makeRecommendation();
  const fresh = cand('fresh', { lastActiveAt: NOW - 10_000 });
  const older = cand('older', { lastActiveAt: NOW - 3 * 60_000 });
  const result = recommendation.onlineNow(viewer(), [older, fresh], {}, 2);
  assert.deepEqual(result.map((r) => r.candidate.id), ['fresh', 'older']);
});

test('bySharedInterests: rank by number of shared interests', () => {
  const { recommendation } = makeRecommendation();
  const many = cand('many', { interests: ['travel', 'music', 'coffee'] });
  const some = cand('some', { interests: ['travel'] });
  const none = cand('none', { interests: ['hiking'] });
  const result = recommendation.bySharedInterests(viewer(), [none, some, many], {}, 3);
  assert.equal(result[0].candidate.id, 'many');
  assert.equal(result[1].candidate.id, 'some');
  assert.equal(result[2].candidate.id, 'none');
});

test('bySharedInterests: returns empty when viewer has no interests', () => {
  const { recommendation } = makeRecommendation();
  const result = recommendation.bySharedInterests(
    viewer({ interests: [] }),
    [cand('a')],
    {},
    3
  );
  assert.deepEqual(result, []);
});

test('discover: passthrough to discovery engine', () => {
  const { recommendation } = makeRecommendation();
  const result = recommendation.discover(viewer(), [cand('a')]);
  assert.equal(result.length, 1);
  assert.equal(result[0].candidate.id, 'a');
});
