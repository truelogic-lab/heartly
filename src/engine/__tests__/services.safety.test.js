import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createEngine } from '../container.js';
import { ManualClock } from '../core/clock.js';
import { EVENTS } from '../core/constants.js';

const NOW = Date.UTC(2025, 5, 15);

test('safety service: block creates a record and emits event', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const seen = [];
  engine.events.subscribe(EVENTS.USER_BLOCKED, (e) => seen.push(e));
  const r = await engine.services.safety.block('a', 'b');
  assert.ok(r.id);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].blockerId, 'a');
  assert.equal(seen[0].blockedId, 'b');
});

test('safety service: blocked users disappear from discovery feed', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const a = await engine.repositories.users.create({ email: 'a@x.com', name: 'A' });
  const b = await engine.repositories.users.create({ email: 'b@x.com', name: 'B' });
  await engine.services.profile.ensureProfile(a.id, { name: 'A', location: { lat: 0, lng: 0 } });
  await engine.services.profile.ensureProfile(b.id, { name: 'B', location: { lat: 0, lng: 0 } });
  await engine.services.safety.block(a.id, b.id);
  const feed = await engine.services.discovery.feedFor(a.id);
  assert.equal(feed.length, 0);
});

test('safety service: block marks existing match as blocked', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const a = await engine.repositories.users.create({ email: 'a@x.com', name: 'A' });
  const b = await engine.repositories.users.create({ email: 'b@x.com', name: 'B' });
  await engine.services.profile.ensureProfile(a.id, { name: 'A' });
  await engine.services.profile.ensureProfile(b.id, { name: 'B' });
  await engine.services.like.like(a.id, b.id);
  const match = (await engine.services.like.like(b.id, a.id)).match;
  await engine.services.safety.block(a.id, b.id);
  const updated = await engine.repositories.matches.findById(match.id);
  assert.equal(updated.blocked, true);
});

test('safety service: block is idempotent', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const first = await engine.services.safety.block('a', 'b');
  const second = await engine.services.safety.block('a', 'b');
  assert.equal(first.id, second.id);
});

test('safety service: unblock removes and emits', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const seen = [];
  engine.events.subscribe(EVENTS.USER_UNBLOCKED, (e) => seen.push(e));
  await engine.services.safety.block('a', 'b');
  await engine.services.safety.unblock('a', 'b');
  assert.equal(await engine.repositories.blocks.find('a', 'b'), null);
  assert.equal(seen.length, 1);
});

test('safety service: unblock without a block fails', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  await assert.rejects(() => engine.services.safety.unblock('a', 'b'));
});

test('safety service: report requires a reason and emits', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const seen = [];
  engine.events.subscribe(EVENTS.USER_REPORTED, (e) => seen.push(e));
  await assert.rejects(() => engine.services.safety.report('a', 'b', ''), /reason/i);
  const r = await engine.services.safety.report('a', 'b', 'spam');
  assert.equal(r.reason, 'spam');
  assert.equal(seen.length, 1);
});

test('safety service: cannot block yourself', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  await assert.rejects(() => engine.services.safety.block('a', 'a'), /yourself/i);
});

test('safety service: cannot report yourself', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  await assert.rejects(() => engine.services.safety.report('a', 'a', 'reason'), /yourself/i);
});
