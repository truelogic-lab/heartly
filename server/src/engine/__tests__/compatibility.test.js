import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CompatibilityEngine } from '../domain/CompatibilityEngine.js';

function viewer(over = {}) {
  return {
    id: 'a',
    birthdate: Date.UTC(1998, 0, 1),
    intention: 'long_term',
    interests: ['travel', 'music', 'coffee'],
    location: { lat: 40.7, lng: -74.0 },
    preferences: { minAge: 20, maxAge: 35, maxDistanceKm: 50 },
    prompts: [{ promptId: 'sunrise', answer: 'Sunset' }],
    ...over,
  };
}

function candidate(over = {}) {
  return {
    id: 'b',
    birthdate: Date.UTC(1996, 0, 1),
    intention: 'long_term',
    interests: ['travel', 'music', 'coffee'],
    location: { lat: 40.71, lng: -74.01 },
    photos: [{}, {}, {}, {}, {}, {}],
    bio: 'Hello',
    name: 'Sam',
    gender: 'man',
    verified: true,
    prompts: [{ promptId: 'sunrise', answer: 'sunset' }],
    ...over,
  };
}

test('score: is bounded 0–100', () => {
  const engine = new CompatibilityEngine();
  const s = engine.score(viewer(), candidate());
  assert.ok(s >= 0 && s <= 100);
});

test('score: perfect overlap scores high', () => {
  const engine = new CompatibilityEngine();
  const s = engine.score(viewer(), candidate());
  assert.ok(s >= 70, `expected high score, got ${s}`);
});

test('score: missing data returns 0', () => {
  const engine = new CompatibilityEngine();
  assert.equal(engine.score(null, candidate()), 0);
  assert.equal(engine.score(viewer(), null), 0);
});

test('shared interests increase score', () => {
  const engine = new CompatibilityEngine();
  const same = engine.score(viewer(), candidate());
  const different = engine.score(
    viewer(),
    candidate({ interests: ['hiking', 'cooking', 'painting'] })
  );
  assert.ok(same > different, `same ${same} should beat different ${different}`);
});

test('incompatible intention reduces score', () => {
  const engine = new CompatibilityEngine();
  const same = engine.score(viewer(), candidate());
  const diff = engine.score(viewer(), candidate({ intention: 'short_term' }));
  assert.ok(same > diff);
});

test('out-of-range age returns lower score', () => {
  const engine = new CompatibilityEngine();
  const inRange = engine.score(viewer(), candidate());
  const outOfRange = engine.score(
    viewer(),
    candidate({ birthdate: Date.UTC(1970, 0, 1) })
  );
  assert.ok(inRange > outOfRange);
});

test('far distance reduces score', () => {
  const engine = new CompatibilityEngine();
  const near = engine.score(viewer(), candidate());
  const far = engine.score(
    viewer(),
    candidate({ location: { lat: 34.05, lng: -118.24 } }) // LA
  );
  assert.ok(near > far);
});

test('prompt answers matching increases score', () => {
  const engine = new CompatibilityEngine();
  const match = engine.score(viewer(), candidate());
  const mismatch = engine.score(
    viewer(),
    candidate({ prompts: [{ promptId: 'sunrise', answer: 'Sunrise' }] })
  );
  assert.ok(match >= mismatch);
});

test('breakdown returns all factors in 0–1 range', () => {
  const engine = new CompatibilityEngine();
  const b = engine.breakdown(viewer(), candidate());
  for (const [k, v] of Object.entries(b)) {
    assert.ok(v >= 0 && v <= 1, `${k} out of range: ${v}`);
  }
});
