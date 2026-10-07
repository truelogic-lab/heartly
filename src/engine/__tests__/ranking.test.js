import { test } from 'node:test';
import assert from 'node:assert/strict';

import { RankingEngine } from '../domain/RankingEngine.js';
import { ProfileEngine } from '../domain/ProfileEngine.js';
import { ManualClock } from '../core/clock.js';

const NOW = Date.UTC(2025, 5, 15);

function makeEngines() {
  const clock = new ManualClock(NOW);
  const profileEngine = new ProfileEngine({ clock });
  return { ranking: new RankingEngine({ profileEngine }), profileEngine, clock };
}

function viewer() {
  return {
    id: 'v1',
    interests: ['travel', 'music'],
    location: { lat: 40.7, lng: -74.0 },
    preferences: { maxDistanceKm: 50 },
  };
}

function cand(id, over = {}) {
  return {
    id,
    name: 'Cand',
    bio: 'bio',
    birthdate: Date.UTC(1996, 0, 1),
    gender: 'woman',
    location: { lat: 40.71, lng: -74.01 },
    photos: [{}, {}, {}],
    interests: ['travel', 'music', 'coffee'],
    prompts: [{}, {}, {}],
    verified: true,
    lastActiveAt: NOW - 60_000,
    ...over,
  };
}

test('rank: score in 0–1 with all factors', () => {
  const { ranking } = makeEngines();
  const { score, breakdown } = ranking.rank(viewer(), cand('c1'), 80);
  assert.ok(score >= 0 && score <= 1);
  for (const [k, v] of Object.entries(breakdown)) {
    assert.ok(v >= 0 && v <= 1, `${k} out of range: ${v}`);
  }
});

test('rank: verified + recently active beats sparse inactive', () => {
  const { ranking } = makeEngines();
  const strong = ranking.rank(viewer(), cand('a'), 90).score;
  const weak = ranking.rank(
    viewer(),
    cand('b', {
      verified: false,
      photos: [],
      bio: '',
      interests: [],
      prompts: [],
      lastActiveAt: NOW - 30 * 24 * 60 * 60_000,
    }),
    10
  ).score;
  assert.ok(strong > weak, `${strong} should beat ${weak}`);
});

test('rank: closer candidate scores higher', () => {
  const { ranking } = makeEngines();
  const close = ranking.rank(viewer(), cand('a', { location: { lat: 40.705, lng: -74.005 } }), 70).score;
  const far   = ranking.rank(viewer(), cand('b', { location: { lat: 34.05, lng: -118.24 } }), 70).score;
  assert.ok(close > far);
});

test('sort: returns descending by rankingScore', () => {
  const { ranking } = makeEngines();
  const items = [
    { candidate: cand('a'), compatibility: 40 },
    { candidate: cand('b'), compatibility: 90 },
    { candidate: cand('c'), compatibility: 65 },
  ];
  const sorted = ranking.sort(viewer(), items);
  assert.ok(sorted[0].rankingScore >= sorted[1].rankingScore);
  assert.ok(sorted[1].rankingScore >= sorted[2].rankingScore);
});

test('sort: deterministic tie-break by candidate id', () => {
  const { ranking } = makeEngines();
  const items = [
    { candidate: cand('z'), compatibility: 50 },
    { candidate: cand('a'), compatibility: 50 },
    { candidate: cand('m'), compatibility: 50 },
  ];
  const sorted = ranking.sort(viewer(), items);
  // Equal scores → sorted by id alphabetically
  assert.equal(sorted[0].candidate.id, 'a');
  assert.equal(sorted[1].candidate.id, 'm');
  assert.equal(sorted[2].candidate.id, 'z');
});

test('sort: empty list returns empty', () => {
  const { ranking } = makeEngines();
  assert.deepEqual(ranking.sort(viewer(), []), []);
});
