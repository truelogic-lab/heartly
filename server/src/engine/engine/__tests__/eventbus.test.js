import { test } from 'node:test';
import assert from 'node:assert/strict';

import { EventBus } from '../events/EventBus.js';
import { EVENTS } from '../core/constants.js';

test('eventbus: publish delivers to subscribers', () => {
  const bus = new EventBus();
  let seen = null;
  bus.subscribe(EVENTS.MATCH_CREATED, (e) => { seen = e; });
  bus.publish({ type: EVENTS.MATCH_CREATED, matchId: 'm1' });
  assert.equal(seen.matchId, 'm1');
});

test('eventbus: unsubscribe stops delivery', () => {
  const bus = new EventBus();
  let count = 0;
  const fn = () => count++;
  bus.subscribe(EVENTS.MATCH_CREATED, fn);
  bus.publish({ type: EVENTS.MATCH_CREATED });
  bus.unsubscribe(EVENTS.MATCH_CREATED, fn);
  bus.publish({ type: EVENTS.MATCH_CREATED });
  assert.equal(count, 1);
});

test('eventbus: returns unsubscribe function from subscribe', () => {
  const bus = new EventBus();
  let count = 0;
  const unsub = bus.subscribe(EVENTS.MATCH_CREATED, () => count++);
  bus.publish({ type: EVENTS.MATCH_CREATED });
  unsub();
  bus.publish({ type: EVENTS.MATCH_CREATED });
  assert.equal(count, 1);
});

test('eventbus: publish without type throws', () => {
  const bus = new EventBus();
  assert.throws(() => bus.publish({}));
  assert.throws(() => bus.publish(null));
});

test('eventbus: one broken handler does not stop others', () => {
  const errors = [];
  const bus = new EventBus({ onError: (e) => errors.push(e) });
  let delivered = 0;
  bus.subscribe(EVENTS.MATCH_CREATED, () => { throw new Error('boom'); });
  bus.subscribe(EVENTS.MATCH_CREATED, () => delivered++);
  bus.publish({ type: EVENTS.MATCH_CREATED });
  assert.equal(delivered, 1);
  assert.equal(errors.length, 1);
});

test('eventbus: listenerCount tracks subscriptions', () => {
  const bus = new EventBus();
  assert.equal(bus.listenerCount(EVENTS.MATCH_CREATED), 0);
  const unsub = bus.subscribe(EVENTS.MATCH_CREATED, () => {});
  assert.equal(bus.listenerCount(EVENTS.MATCH_CREATED), 1);
  unsub();
  assert.equal(bus.listenerCount(EVENTS.MATCH_CREATED), 0);
});
