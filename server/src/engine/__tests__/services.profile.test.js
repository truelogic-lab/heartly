import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createEngine } from '../container.js';
import { ManualClock } from '../core/clock.js';

const NOW = Date.UTC(2025, 5, 15);

function setup() {
  const clock = new ManualClock(NOW);
  return createEngine({ clock });
}

test('profile service: ensureProfile creates + returns enriched profile', async () => {
  const engine = setup();
  const p = await engine.services.profile.ensureProfile('u1', {
    name: 'Sophie',
    bio: 'hi',
    gender: 'woman',
    birthdate: Date.UTC(1998, 0, 1),
    location: { lat: 40.7, lng: -74.0 },
    interests: ['travel', 'music'],
  });
  assert.equal(p.userId, 'u1');
  assert.equal(p.name, 'Sophie');
  assert.deepEqual(p.photos, []);
  assert.deepEqual(p.prompts, []);
});

test('profile service: ensureProfile is idempotent', async () => {
  const engine = setup();
  const a = await engine.services.profile.ensureProfile('u1', { name: 'A' });
  const b = await engine.services.profile.ensureProfile('u1', { name: 'B' });
  assert.equal(a.userId, b.userId);
  assert.equal(b.name, 'A'); // initial wins, second is a no-op
});

test('profile service: update validates input', async () => {
  const engine = setup();
  await engine.services.profile.ensureProfile('u1', { name: 'Sophie' });
  await assert.rejects(
    () => engine.services.profile.update('u1', { name: '' }),
    /at least/i
  );
  await assert.rejects(
    () => engine.services.profile.update('u1', { bio: 'x'.repeat(600) }),
    /at most/i
  );
});

test('profile service: update merges preferences deeply', async () => {
  const engine = setup();
  await engine.services.profile.ensureProfile('u1', {
    name: 'S',
    preferences: { minAge: 20, maxAge: 40, maxDistanceKm: 30 },
  });
  const p = await engine.services.profile.update('u1', {
    preferences: { maxDistanceKm: 100 },
  });
  assert.equal(p.preferences.minAge, 20);
  assert.equal(p.preferences.maxAge, 40);
  assert.equal(p.preferences.maxDistanceKm, 100);
});

test('profile service: touch updates lastActiveAt', async () => {
  const engine = setup();
  await engine.services.profile.ensureProfile('u1', { name: 'S' });
  engine.clock.tick(5000);
  await engine.services.profile.touch('u1');
  const p = await engine.services.profile.getEnriched('u1');
  assert.equal(p.lastActiveAt, NOW + 5000);
});

test('profile service: completeness', async () => {
  const engine = setup();
  const p = await engine.services.profile.ensureProfile('u1', {
    name: 'Sophie',
    bio: 'hi',
    gender: 'woman',
    birthdate: Date.UTC(1998, 0, 1),
    location: { lat: 40.7, lng: -74.0 },
    interests: ['travel', 'music', 'coffee'],
    verified: true,
  });
  const c = engine.services.profile.completeness(p);
  assert.ok(c >= 50 && c <= 100, `expected decent completeness, got ${c}`);
});
