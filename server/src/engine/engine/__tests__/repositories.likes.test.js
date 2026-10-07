import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MemoryLikeRepository } from '../repositories/memory/MemoryLikeRepository.js';
import { ManualClock } from '../core/clock.js';

const NOW = Date.UTC(2025, 5, 15);

function setup() {
  const clock = new ManualClock(NOW);
  return { likes: new MemoryLikeRepository({ clock }), clock };
}

test('like repo: add + find', async () => {
  const { likes } = setup();
  const l = await likes.addLike({ fromUserId: 'a', toUserId: 'b' });
  assert.ok(l.id);
  const found = await likes.findLike('a', 'b');
  assert.equal(found.id, l.id);
});

test('like repo: duplicate like returns existing', async () => {
  const { likes } = setup();
  const a = await likes.addLike({ fromUserId: 'a', toUserId: 'b' });
  const b = await likes.addLike({ fromUserId: 'a', toUserId: 'b' });
  assert.equal(a.id, b.id);
});

test('like repo: hasLiked and listOutbound', async () => {
  const { likes } = setup();
  await likes.addLike({ fromUserId: 'a', toUserId: 'b' });
  await likes.addLike({ fromUserId: 'a', toUserId: 'c' });
  assert.equal(await likes.hasLiked('a', 'b'), true);
  assert.equal(await likes.hasLiked('b', 'a'), false);
  const outbound = await likes.listOutbound('a');
  assert.equal(outbound.length, 2);
});

test('like repo: listInbound', async () => {
  const { likes } = setup();
  await likes.addLike({ fromUserId: 'a', toUserId: 'x' });
  await likes.addLike({ fromUserId: 'b', toUserId: 'x' });
  await likes.addLike({ fromUserId: 'c', toUserId: 'y' });
  const inbound = await likes.listInbound('x');
  assert.equal(inbound.length, 2);
});

test('like repo: super like preserved', async () => {
  const { likes } = setup();
  const l = await likes.addLike({ fromUserId: 'a', toUserId: 'b', kind: 'super_like' });
  assert.equal(l.kind, 'super_like');
});

test('like repo: removeLike deletes record', async () => {
  const { likes } = setup();
  await likes.addLike({ fromUserId: 'a', toUserId: 'b' });
  await likes.removeLike('a', 'b');
  assert.equal(await likes.hasLiked('a', 'b'), false);
});

test('like repo: pass is separate from like', async () => {
  const { likes } = setup();
  await likes.addPass({ fromUserId: 'a', toUserId: 'b' });
  assert.equal(await likes.hasPassed('a', 'b'), true);
  assert.equal(await likes.hasLiked('a', 'b'), false);
});

test('like repo: duplicate pass returns existing', async () => {
  const { likes } = setup();
  const a = await likes.addPass({ fromUserId: 'a', toUserId: 'b' });
  const b = await likes.addPass({ fromUserId: 'a', toUserId: 'b' });
  assert.equal(a.id, b.id);
});

test('like repo: counts', async () => {
  const { likes } = setup();
  await likes.addLike({ fromUserId: 'a', toUserId: 'b' });
  await likes.addLike({ fromUserId: 'a', toUserId: 'c' });
  assert.equal(await likes.countOutbound('a'), 2);
  assert.equal(await likes.countInbound('b'), 1);
});
