import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MemoryMatchRepository } from '../repositories/memory/MemoryMatchRepository.js';
import { ManualClock } from '../core/clock.js';

const NOW = Date.UTC(2025, 5, 15);

function setup() {
  const clock = new ManualClock(NOW);
  return { matches: new MemoryMatchRepository({ clock }), clock };
}

test('match repo: create + findById', async () => {
  const { matches } = setup();
  const m = await matches.create({ id: 'm1', users: ['a', 'b'] });
  assert.equal(m.id, 'm1');
  assert.deepEqual(m.users, ['a', 'b']);
  const found = await matches.findById('m1');
  assert.equal(found.id, 'm1');
});

test('match repo: users always sorted', async () => {
  const { matches } = setup();
  const m = await matches.create({ id: 'm1', users: ['z', 'a'] });
  assert.deepEqual(m.users, ['a', 'z']);
});

test('match repo: findBetween', async () => {
  const { matches } = setup();
  await matches.create({ id: 'm1', users: ['a', 'b'] });
  assert.ok(await matches.findBetween('a', 'b'));
  assert.ok(await matches.findBetween('b', 'a'));
  assert.equal(await matches.findBetween('a', 'c'), null);
});

test('match repo: duplicate create returns existing', async () => {
  const { matches } = setup();
  const a = await matches.create({ id: 'm1', users: ['a', 'b'] });
  const b = await matches.create({ id: 'm1', users: ['a', 'b'] });
  assert.equal(a, b);
});

test('match repo: listForUser excludes deleted', async () => {
  const { matches } = setup();
  await matches.create({ id: 'm1', users: ['a', 'b'] });
  await matches.create({ id: 'm2', users: ['a', 'c'] });
  await matches.softDelete('m2');
  const list = await matches.listForUser('a');
  assert.equal(list.length, 1);
  assert.equal(list[0].id, 'm1');
});

test('match repo: listForUser sorts by lastMessageAt then createdAt', async () => {
  const { matches, clock } = setup();
  await matches.create({ id: 'm1', users: ['a', 'b'] });
  clock.tick(100);
  await matches.create({ id: 'm2', users: ['a', 'c'] });
  const list = await matches.listForUser('a');
  // m2 was created later, so it comes first when both have no messages
  assert.equal(list[0].id, 'm2');
});

test('match repo: count', async () => {
  const { matches } = setup();
  await matches.create({ id: 'm1', users: ['a', 'b'] });
  await matches.create({ id: 'm2', users: ['a', 'c'] });
  assert.equal(await matches.countForUser('a'), 2);
  assert.equal(await matches.countForUser('b'), 1);
});
