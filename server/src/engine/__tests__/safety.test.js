import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SafetyEngine } from '../domain/SafetyEngine.js';
import { ManualClock } from '../core/clock.js';
import { EVENTS } from '../core/constants.js';

const NOW = Date.UTC(2025, 5, 15);

function makeSafety() {
  const clock = new ManualClock(NOW);
  return { safety: new SafetyEngine({ clock }), clock };
}

test('canBlock: allowed between distinct users', () => {
  const { safety } = makeSafety();
  const r = safety.canBlock({ viewerId: 'a', targetId: 'b' });
  assert.equal(r.allowed, true);
});

test('canBlock: self-block denied', () => {
  const { safety } = makeSafety();
  const r = safety.canBlock({ viewerId: 'a', targetId: 'a' });
  assert.equal(r.allowed, false);
  assert.equal(r.code, 'SELF_ACTION');
});

test('canBlock: duplicate is a noop', () => {
  const { safety } = makeSafety();
  const r = safety.canBlock({ viewerId: 'a', targetId: 'b', alreadyBlocked: true });
  assert.equal(r.allowed, false);
  assert.equal(r.noop, true);
});

test('canUnblock: allowed only when a block exists', () => {
  const { safety } = makeSafety();
  const ok = safety.canUnblock({ viewerId: 'a', targetId: 'b', isBlocked: true });
  assert.equal(ok.allowed, true);
  const no = safety.canUnblock({ viewerId: 'a', targetId: 'b', isBlocked: false });
  assert.equal(no.allowed, false);
  assert.equal(no.code, 'NOT_FOUND');
});

test('prepareBlock: returns records with an event payload', () => {
  const { safety } = makeSafety();
  const b = safety.prepareBlock({ viewerId: 'a', targetId: 'b' });
  assert.equal(b.blockerId, 'a');
  assert.equal(b.blockedId, 'b');
  assert.equal(b.createdAt, NOW);
  assert.equal(b.event.type, EVENTS.USER_BLOCKED);
});

test('prepareUnblock: returns an event payload', () => {
  const { safety } = makeSafety();
  const u = safety.prepareUnblock({ viewerId: 'a', targetId: 'b' });
  assert.equal(u.event.type, EVENTS.USER_UNBLOCKED);
});

test('canReport: requires a reason', () => {
  const { safety } = makeSafety();
  assert.equal(safety.canReport({ viewerId: 'a', targetId: 'b', reason: 'spam' }).allowed, true);
  assert.equal(safety.canReport({ viewerId: 'a', targetId: 'b', reason: '' }).allowed, false);
  assert.equal(safety.canReport({ viewerId: 'a', targetId: 'a', reason: 'spam' }).allowed, false);
});

test('canReport: rejects reason over 500 chars', () => {
  const { safety } = makeSafety();
  const r = safety.canReport({ viewerId: 'a', targetId: 'b', reason: 'x'.repeat(501) });
  assert.equal(r.allowed, false);
});

test('prepareReport: trims and stamps', () => {
  const { safety } = makeSafety();
  const r = safety.prepareReport({ viewerId: 'a', targetId: 'b', reason: '  spam  ' });
  assert.equal(r.reason, 'spam');
  assert.equal(r.createdAt, NOW);
  assert.equal(r.event.type, EVENTS.USER_REPORTED);
});
