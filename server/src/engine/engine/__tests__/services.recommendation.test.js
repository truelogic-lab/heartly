import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createEngine } from '../container.js';
import { ManualClock } from '../core/clock.js';

const NOW = Date.UTC(2025, 5, 15);

async function seed(engine, count = 6) {
  const viewer = await engine.repositories.users.create({ email: 'viewer@x.com', name: 'Viewer' });
  await engine.services.profile.ensureProfile(viewer.id, {
    name: 'Viewer',
    birthdate: Date.UTC(1998, 0, 1),
    gender: 'woman',
    location: { lat: 0, lng: 0 },
    interests: ['travel', 'music'],
    preferences: { minAge: 18, maxAge: 80, maxDistanceKm: 500, lookingFor: 'everyone' },
  });
  const ids = [];
  for (let i = 0; i < count; i++) {
    const u = await engine.repositories.users.create({ email: `u${i}@x.com`, name: `U${i}` });
    await engine.services.profile.ensureProfile(u.id, {
      name: `U${i}`,
      birthdate: Date.UTC(1996, 0, 1),
      gender: 'man',
      location: { lat: 0.01, lng: 0.01 },
      interests: ['travel', 'music', 'coffee'],
      verified: true,
      lastActiveAt: NOW - (i * 60_000),
    });
    ids.push(u.id);
  }
  return { viewer: viewer.id, ids };
}

test('recommendation service: dailyPicks returns enriched profiles', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { viewer } = await seed(engine, 6);
  const picks = await engine.services.recommendation.dailyPicks(viewer, '2026-10-07');
  assert.ok(picks.length <= 4);
  if (picks.length > 0) {
    assert.ok(picks[0].profile);
    assert.ok(typeof picks[0].compatibility === 'number');
  }
});

test('recommendation service: dailyPicks deterministic for same day', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { viewer } = await seed(engine, 6);
  const a = await engine.services.recommendation.dailyPicks(viewer, '2026-10-07');
  const b = await engine.services.recommendation.dailyPicks(viewer, '2026-10-07');
  assert.deepEqual(
    a.map((r) => r.profile.userId),
    b.map((r) => r.profile.userId)
  );
});

test('recommendation service: onlineNow returns candidates', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { viewer } = await seed(engine, 4);
  const list = await engine.services.recommendation.onlineNow(viewer, 3);
  assert.ok(list.length > 0);
  assert.ok(list[0].profile);
});

test('recommendation service: bySharedInterests returns enriched', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { viewer } = await seed(engine, 4);
  const list = await engine.services.recommendation.bySharedInterests(viewer, 3);
  assert.ok(list.length > 0);
});
