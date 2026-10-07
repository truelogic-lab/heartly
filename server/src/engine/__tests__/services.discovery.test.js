import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createEngine } from '../container.js';
import { ManualClock } from '../core/clock.js';

const NOW = Date.UTC(2025, 5, 15);

test('discovery service: returns ranked feed with enriched profiles', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const viewer = await engine.repositories.users.create({ email: 'v@x.com', name: 'V' });
  await engine.services.profile.ensureProfile(viewer.id, {
    name: 'Viewer',
    gender: 'woman',
    location: { lat: 0, lng: 0 },
    birthdate: Date.UTC(1998, 0, 1),
    preferences: { minAge: 18, maxAge: 80, maxDistanceKm: 100, lookingFor: 'everyone' },
  });
  for (let i = 0; i < 3; i++) {
    const u = await engine.repositories.users.create({ email: `u${i}@x.com`, name: `U${i}` });
    await engine.services.profile.ensureProfile(u.id, {
      name: `U${i}`,
      gender: 'man',
      location: { lat: 0.01, lng: 0.01 },
      birthdate: Date.UTC(1996, 0, 1),
      verified: true,
    });
  }
  const feed = await engine.services.discovery.feedFor(viewer.id);
  assert.equal(feed.length, 3);
  assert.ok(feed[0].profile);
  assert.ok(feed[0].compatibility >= 0);
});

test('discovery service: excludes liked / passed / matched', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const viewer = await engine.repositories.users.create({ email: 'v@x.com', name: 'V' });
  const a = await engine.repositories.users.create({ email: 'a@x.com', name: 'A' });
  const b = await engine.repositories.users.create({ email: 'b@x.com', name: 'B' });
  await engine.services.profile.ensureProfile(viewer.id, {
    name: 'V', gender: 'woman', birthdate: Date.UTC(1998, 0, 1),
    location: { lat: 0, lng: 0 },
    preferences: { minAge: 18, maxAge: 80, maxDistanceKm: 100, lookingFor: 'everyone' },
  });
  await engine.services.profile.ensureProfile(a.id, { name: 'A', gender: 'man', birthdate: Date.UTC(1996, 0, 1), location: { lat: 0.01, lng: 0.01 } });
  await engine.services.profile.ensureProfile(b.id, { name: 'B', gender: 'man', birthdate: Date.UTC(1996, 0, 1), location: { lat: 0.01, lng: 0.01 } });
  await engine.services.like.like(viewer.id, a.id);
  const feed = await engine.services.discovery.feedFor(viewer.id);
  assert.equal(feed.length, 1);
  assert.equal(feed[0].profile.userId, b.id);
});
