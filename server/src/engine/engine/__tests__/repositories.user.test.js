import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MemoryUserRepository } from '../repositories/memory/MemoryUserRepository.js';
import { ManualClock } from '../core/clock.js';

const NOW = Date.UTC(2025, 5, 15);

function setup() {
  const clock = new ManualClock(NOW);
  return { users: new MemoryUserRepository({ clock }), clock };
}

test('user repo: create + find', async () => {
  const { users } = setup();
  const u = await users.create({ email: 'a@example.com', name: 'Alice' });
  assert.ok(u.id);
  assert.equal(u.email, 'a@example.com');
  const found = await users.findById(u.id);
  assert.equal(found.id, u.id);
});

test('user repo: email is lowercased and unique', async () => {
  const { users } = setup();
  const a = await users.create({ email: 'A@Example.com', name: 'Alice' });
  assert.equal(a.email, 'a@example.com');
  const found = await users.findByEmail('A@EXAMPLE.COM');
  assert.equal(found.id, a.id);
});

test('user repo: findByEmail miss returns null', async () => {
  const { users } = setup();
  assert.equal(await users.findByEmail('nobody@example.com'), null);
});

test('user repo: update preserves createdAt', async () => {
  const { users, clock } = setup();
  const u = await users.create({ email: 'a@x.com', name: 'A' });
  clock.tick(1000);
  const updated = await users.update(u.id, { name: 'Alice' });
  assert.equal(updated.name, 'Alice');
  assert.equal(updated.createdAt, u.createdAt);
  assert.ok(updated.updatedAt > u.createdAt);
});

test('user repo: delete removes from both indexes', async () => {
  const { users } = setup();
  const u = await users.create({ email: 'a@x.com', name: 'A' });
  await users.delete(u.id);
  assert.equal(await users.findById(u.id), null);
  assert.equal(await users.findByEmail('a@x.com'), null);
});

test('user repo: count reflects records', async () => {
  const { users } = setup();
  assert.equal(await users.count(), 0);
  await users.create({ email: 'a@x.com', name: 'A' });
  await users.create({ email: 'b@x.com', name: 'B' });
  assert.equal(await users.count(), 2);
});
