import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createEngine } from '../container.js';
import { ManualClock } from '../core/clock.js';
import { EVENTS, LIKE_KIND } from '../core/constants.js';

const NOW = Date.UTC(2025, 5, 15);

async function makeUsers(engine) {
  const a = await engine.repositories.users.create({ email: 'a@x.com', name: 'A' });
  const b = await engine.repositories.users.create({ email: 'b@x.com', name: 'B' });
  await engine.services.profile.ensureProfile(a.id, { name: 'A' });
  await engine.services.profile.ensureProfile(b.id, { name: 'B' });
  return { a: a.id, b: b.id };
}

test('like service: self-like rejected', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a } = await makeUsers(engine);
  await assert.rejects(() => engine.services.like.like(a, a), /yourself/i);
});

test('like service: missing target rejected', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a } = await makeUsers(engine);
  await assert.rejects(() => engine.services.like.like(a, 'nope'), /not found/i);
});

test('like service: like succeeds and emits event', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, b } = await makeUsers(engine);
  const events = [];
  engine.events.subscribe(EVENTS.LIKE_CREATED, (e) => events.push(e));
  const result = await engine.services.like.like(a, b);
  assert.equal(result.matched, false);
  assert.ok(result.like.id);
  assert.equal(events.length, 1);
  assert.equal(events[0].fromUserId, a);
});

test('like service: duplicate like rejected', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, b } = await makeUsers(engine);
  await engine.services.like.like(a, b);
  await assert.rejects(() => engine.services.like.like(a, b), /already liked/i);
});

test('like service: super like is a distinct kind', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, b } = await makeUsers(engine);
  const result = await engine.services.like.superLike(a, b);
  assert.equal(result.like.kind, LIKE_KIND.SUPER);
});

test('like service: one-sided like does not create match', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, b } = await makeUsers(engine);
  const result = await engine.services.like.like(a, b);
  assert.equal(result.matched, false);
  assert.equal(await engine.repositories.matches.countForUser(a), 0);
});

test('like service: mutual like creates a match', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, b } = await makeUsers(engine);
  await engine.services.like.like(a, b);
  const result = await engine.services.like.like(b, a);
  assert.equal(result.matched, true);
  assert.ok(result.match.id);
  assert.equal(result.match.users.length, 2);
});

test('like service: mutual like emits MATCH_CREATED', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, b } = await makeUsers(engine);
  const events = [];
  engine.events.subscribe(EVENTS.MATCH_CREATED, (e) => events.push(e));
  await engine.services.like.like(a, b);
  await engine.services.like.like(b, a);
  assert.equal(events.length, 1);
  assert.equal(events[0].users.length, 2);
});

test('like service: duplicate match is prevented', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, b } = await makeUsers(engine);
  await engine.services.like.like(a, b);
  await engine.services.like.like(b, a);
  // Second pass: B likes A again is prevented at the like layer (duplicate)
  await assert.rejects(() => engine.services.like.like(b, a), /already liked/i);
  assert.equal(await engine.repositories.matches.countForUser(a), 1);
});

test('like service: pass is separate from like', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, b } = await makeUsers(engine);
  await engine.services.like.pass(a, b);
  assert.equal(await engine.repositories.likes.hasPassed(a, b), true);
  assert.equal(await engine.repositories.likes.hasLiked(a, b), false);
});

test('like service: pass on already-passed is a noop', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, b } = await makeUsers(engine);
  await engine.services.like.pass(a, b);
  const second = await engine.services.like.pass(a, b);
  assert.equal(second, null);
});

test('like service: blocked either direction rejects like', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, b } = await makeUsers(engine);
  await engine.repositories.blocks.add({ blockerId: a, blockedId: b });
  await assert.rejects(() => engine.services.like.like(a, b), /blocked/i);
});

test('like service: inbound + outbound lists', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, b } = await makeUsers(engine);
  await engine.services.like.like(a, b);
  const received = await engine.services.like.likesReceived(b);
  const sent = await engine.services.like.likesSent(a);
  assert.equal(received.length, 1);
  assert.equal(sent.length, 1);
});
