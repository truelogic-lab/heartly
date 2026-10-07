import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createEngine } from '../container.js';
import { ManualClock } from '../core/clock.js';
import { EVENTS } from '../core/constants.js';

const NOW = Date.UTC(2025, 5, 15);

async function matchedPair(engine) {
  const a = await engine.repositories.users.create({ email: 'a@x.com', name: 'A' });
  const b = await engine.repositories.users.create({ email: 'b@x.com', name: 'B' });
  await engine.services.profile.ensureProfile(a.id, { name: 'A' });
  await engine.services.profile.ensureProfile(b.id, { name: 'B' });
  await engine.services.like.like(a.id, b.id);
  const result = await engine.services.like.like(b.id, a.id);
  return { a: a.id, b: b.id, matchId: result.match.id };
}

test('message service: matched users can message', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, matchId } = await matchedPair(engine);
  const m = await engine.services.message.send(matchId, a, 'hello!');
  assert.equal(m.body, 'hello!');
  assert.equal(m.senderId, a);
  assert.equal(m.matchId, matchId);
});

test('message service: emits MESSAGE_SENT', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, matchId } = await matchedPair(engine);
  const seen = [];
  engine.events.subscribe(EVENTS.MESSAGE_SENT, (e) => seen.push(e));
  await engine.services.message.send(matchId, a, 'hi');
  assert.equal(seen.length, 1);
  assert.equal(seen[0].matchId, matchId);
});

test('message service: unmatched users cannot message', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const a = await engine.repositories.users.create({ email: 'a@x.com', name: 'A' });
  const b = await engine.repositories.users.create({ email: 'b@x.com', name: 'B' });
  await engine.services.profile.ensureProfile(a.id, { name: 'A' });
  await engine.services.profile.ensureProfile(b.id, { name: 'B' });
  // No match — create a fake match id that does not exist
  await assert.rejects(
    () => engine.services.message.send('match_xyz', a.id, 'hi'),
    /not found/i
  );
});

test('message service: blocked match cannot continue messaging', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, b, matchId } = await matchedPair(engine);
  await engine.services.message.send(matchId, a, 'hi');
  await engine.services.safety.block(a, b);
  await assert.rejects(
    () => engine.services.message.send(matchId, a, 'still here?'),
    /blocked/i
  );
});

test('message service: empty message rejected', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, matchId } = await matchedPair(engine);
  await assert.rejects(
    () => engine.services.message.send(matchId, a, '   '),
    /empty/i
  );
});

test('message service: too-long message rejected', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, matchId } = await matchedPair(engine);
  await assert.rejects(
    () => engine.services.message.send(matchId, a, 'x'.repeat(3000)),
    /at most/i
  );
});

test('message service: getConversation returns messages in order', async () => {
  const engine = createEngine({ clock: new ManualClock(NOW) });
  const { a, b, matchId } = await matchedPair(engine);
  await engine.services.message.send(matchId, a, 'first');
  engine.clock.tick(500);
  await engine.services.message.send(matchId, b, 'second');
  engine.clock.tick(500);
  await engine.services.message.send(matchId, a, 'third');

  const { messages } = await engine.services.message.getConversation(matchId, a);
  assert.deepEqual(messages.map((m) => m.body), ['first', 'second', 'third']);
});
