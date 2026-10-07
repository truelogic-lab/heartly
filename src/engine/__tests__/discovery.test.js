import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DiscoveryEngine } from '../domain/DiscoveryEngine.js';
import { RankingEngine } from '../domain/RankingEngine.js';
import { CompatibilityEngine } from '../domain/CompatibilityEngine.js';
import { ProfileEngine } from '../domain/ProfileEngine.js';
import { ManualClock } from '../core/clock.js';
import { GENDERS } from '../core/constants.js';

const NOW = Date.UTC(2025, 5, 15);

function makeDiscovery() {
  const clock = new ManualClock(NOW);
  const profileEngine = new ProfileEngine({ clock });
  const rankingEngine = new RankingEngine({ profileEngine });
  const compatibilityEngine = new CompatibilityEngine();
  const discovery = new DiscoveryEngine({ rankingEngine, compatibilityEngine });
  return { discovery, profileEngine };
}

function viewer(over = {}) {
  return {
    id: 'v',
    birthdate: Date.UTC(1998, 0, 1),
    gender: GENDERS.WOMAN,
    interests: ['travel', 'music', 'coffee'],
    location: { lat: 40.7, lng: -74.0 },
    preferences: {
      minAge: 20,
      maxAge: 40,
      maxDistanceKm: 50,
      lookingFor: 'men',
    },
    ...over,
  };
}

function cand(id, over = {}) {
  return {
    id,
    name: `Cand ${id}`,
    birthdate: Date.UTC(1996, 0, 1),
    gender: GENDERS.MAN,
    interests: ['travel', 'music'],
    location: { lat: 40.71, lng: -74.01 },
    photos: [{}, {}, {}],
    bio: 'hi',
    prompts: [],
    verified: true,
    lastActiveAt: NOW - 60_000,
    ...over,
  };
}

test('discovery: excludes viewer from own feed', () => {
  const { discovery } = makeDiscovery();
  const v = viewer();
  const result = discovery.discover(v, [v, cand('a')]);
  assert.equal(result.length, 1);
  assert.equal(result[0].candidate.id, 'a');
});

test('discovery: excludes blocked users', () => {
  const { discovery } = makeDiscovery();
  const result = discovery.discover(viewer(), [cand('a'), cand('b')], {
    blockedIds: new Set(['a']),
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].candidate.id, 'b');
});

test('discovery: excludes already-liked users', () => {
  const { discovery } = makeDiscovery();
  const result = discovery.discover(viewer(), [cand('a'), cand('b')], {
    likedIds: new Set(['a']),
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].candidate.id, 'b');
});

test('discovery: excludes passed users', () => {
  const { discovery } = makeDiscovery();
  const result = discovery.discover(viewer(), [cand('a'), cand('b')], {
    passedIds: new Set(['a']),
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].candidate.id, 'b');
});

test('discovery: excludes already matched users', () => {
  const { discovery } = makeDiscovery();
  const result = discovery.discover(viewer(), [cand('a'), cand('b')], {
    matchedIds: new Set(['a']),
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].candidate.id, 'b');
});

test('discovery: excludes deactivated accounts', () => {
  const { discovery } = makeDiscovery();
  const result = discovery.discover(viewer(), [cand('a', { deactivated: true }), cand('b')]);
  assert.equal(result.length, 1);
  assert.equal(result[0].candidate.id, 'b');
});

test('discovery: gender filter — viewer looking for men', () => {
  const { discovery } = makeDiscovery();
  const result = discovery.discover(viewer(), [
    cand('m', { gender: GENDERS.MAN }),
    cand('w', { gender: GENDERS.WOMAN }),
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].candidate.id, 'm');
});

test('discovery: gender filter — everyone sees all', () => {
  const { discovery } = makeDiscovery();
  const v = viewer({ preferences: { lookingFor: 'everyone', minAge: 20, maxAge: 40, maxDistanceKm: 50 } });
  const result = discovery.discover(v, [
    cand('m', { gender: GENDERS.MAN }),
    cand('w', { gender: GENDERS.WOMAN }),
  ]);
  assert.equal(result.length, 2);
});

test('discovery: age filter excludes out-of-range', () => {
  const { discovery } = makeDiscovery();
  const result = discovery.discover(viewer({ preferences: { minAge: 25, maxAge: 30, maxDistanceKm: 50, lookingFor: 'men' } }), [
    cand('young', { birthdate: Date.UTC(2005, 0, 1) }), // ~20
    cand('inrange', { birthdate: Date.UTC(1998, 0, 1) }), // ~27
    cand('old', { birthdate: Date.UTC(1980, 0, 1) }),   // ~45
  ]);
  const ids = result.map((r) => r.candidate.id);
  assert.deepEqual(ids, ['inrange']);
});

test('discovery: distance filter excludes far candidates', () => {
  const { discovery } = makeDiscovery();
  const result = discovery.discover(
    viewer({ preferences: { minAge: 20, maxAge: 40, maxDistanceKm: 50, lookingFor: 'men' } }),
    [
      cand('near', { location: { lat: 40.71, lng: -74.01 } }),
      cand('far',  { location: { lat: 34.05, lng: -118.24 } }), // LA
    ]
  );
  const ids = result.map((r) => r.candidate.id);
  assert.deepEqual(ids, ['near']);
});

test('discovery: sorted by ranking score, descending', () => {
  const { discovery } = makeDiscovery();
  const result = discovery.discover(viewer(), [
    cand('weak', {
      verified: false,
      photos: [],
      bio: '',
      interests: [],
      lastActiveAt: NOW - 30 * 24 * 60 * 60_000,
    }),
    cand('strong', { verified: true }),
  ]);
  assert.equal(result[0].candidate.id, 'strong');
});

test('discovery: empty candidates returns empty', () => {
  const { discovery } = makeDiscovery();
  assert.deepEqual(discovery.discover(viewer(), []), []);
});
