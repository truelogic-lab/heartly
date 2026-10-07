import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MemoryMessageRepository } from '../repositories/memory/MemoryMessageRepository.js';
import { ManualClock } from '../core/clock.js';

const NOW = Date.UTC(2025, 5, 15);

function setup() {
  const clock = new ManualClock(NOW);
  return { messages: new MemoryMessageRepository({ clock }), clock };
}

test('message repo: add + list', async () => {
  const { messages } = setup();
  await messages.add({ matchId: 'm1', senderId: 'a', body: 'hi' });
  const list = await messages.listByMatch('m1');
  assert.equal(list.length, 1);
  assert.equal(list[0].body, 'hi');
});

test('message repo: list chronologically', async () => {
  const { messages, clock } = setup();
  await messages.add({ matchId: 'm1', senderId: 'a', body: '1' });
  clock.tick(1000);
  await messages.add({ matchId: 'm1', senderId: 'b', body: '2' });
  clock.tick(1000);
  await messages.add({ matchId: 'm1', senderId: 'a', body: '3' });
  const list = await messages.listByMatch('m1');
  assert.deepEqual(list.map((m) => m.body), ['1', '2', '3']);
});

test('message repo: only returns messages for the match', async () => {
  const { messages } = setup();
  await messages.add({ matchId: 'm1', senderId: 'a', body: 'hi' });
  await messages.add({ matchId: 'm2', senderId: 'a', body: 'hi2' });
  assert.equal((await messages.listByMatch('m1')).length, 1);
  assert.equal((await messages.listByMatch('m2')).length, 1);
});

test('message repo: markRead marks only inbound', async () => {
  const { messages, clock } = setup();
  await messages.add({ matchId: 'm1', senderId: 'a', body: 'one' });
  clock.tick(100);
  await messages.add({ matchId: 'm1', senderId: 'b', body: 'two' });
  const updated = await messages.markRead('m1', 'a', clock.now());
  assert.equal(updated, 1); // only b's message gets marked for a
  const list = await messages.listByMatch('m1');
  assert.equal(list[0].read, false); // a's own message
  assert.equal(list[1].read, true);  // b's message
});

test('message repo: latestForMatch', async () => {
  const { messages, clock } = setup();
  await messages.add({ matchId: 'm1', senderId: 'a', body: '1' });
  clock.tick(1000);
  await messages.add({ matchId: 'm1', senderId: 'a', body: '2' });
  const latest = await messages.latestForMatch('m1');
  assert.equal(latest.body, '2');
});

test('message repo: count', async () => {
  const { messages } = setup();
  await messages.add({ matchId: 'm1', senderId: 'a', body: '1' });
  await messages.add({ matchId: 'm1', senderId: 'a', body: '2' });
  assert.equal(await messages.countByMatch('m1'), 2);
});
