import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MemoryBlockRepository } from '../repositories/memory/MemoryBlockRepository.js';
import { ManualClock } from '../core/clock.js';

const NOW = Date.UTC(2025, 5, 15);

function setup() {
  const clock = new ManualClock(NOW);
  return { blocks: new MemoryBlockRepository({ clock }), clock };
}

test('block repo: add + find', async () => {
  const { blocks } = setup();
  await blocks.add({ blockerId: 'a', blockedId: 'b' });
  assert.ok(await blocks.find('a', 'b'));
  assert.equal(await blocks.find('b', 'a'), null);
});

test('block repo: duplicate is idempotent', async () => {
  const { blocks } = setup();
  const a = await blocks.add({ blockerId: 'a', blockedId: 'b' });
  const b = await blocks.add({ blockerId: 'a', blockedId: 'b' });
  assert.equal(a.id, b.id);
});

test('block repo: isBlockedEitherDirection', async () => {
  const { blocks } = setup();
  await blocks.add({ blockerId: 'a', blockedId: 'b' });
  assert.equal(await blocks.isBlockedEitherDirection('a', 'b'), true);
  assert.equal(await blocks.isBlockedEitherDirection('b', 'a'), true);
  assert.equal(await blocks.isBlockedEitherDirection('a', 'c'), false);
});

test('block repo: list helpers', async () => {
  const { blocks } = setup();
  await blocks.add({ blockerId: 'a', blockedId: 'b' });
  await blocks.add({ blockerId: 'a', blockedId: 'c' });
  await blocks.add({ blockerId: 'x', blockedId: 'a' });
  assert.equal((await blocks.listByBlocker('a')).length, 2);
  assert.equal((await blocks.listInvolvingUser('a')).length, 3);
});

test('block repo: remove', async () => {
  const { blocks } = setup();
  await blocks.add({ blockerId: 'a', blockedId: 'b' });
  await blocks.remove('a', 'b');
  assert.equal(await blocks.find('a', 'b'), null);
});
