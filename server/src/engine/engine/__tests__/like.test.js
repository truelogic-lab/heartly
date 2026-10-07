import { test } from 'node:test';
import assert from 'node:assert/strict';

import { LikeEngine } from '../domain/LikeEngine.js';
import { LIKE_KIND } from '../core/constants.js';

const engine = new LikeEngine();

test('like: allowed between two distinct users', () => {
  const r = engine.evaluateLike({ viewerId: 'a', targetId: 'b' });
  assert.equal(r.allowed, true);
  assert.equal(r.kind, LIKE_KIND.LIKE);
});

test('like: self-like is denied', () => {
  const r = engine.evaluateLike({ viewerId: 'a', targetId: 'a' });
  assert.equal(r.allowed, false);
  assert.equal(r.code, 'SELF_ACTION');
});

test('like: missing target is denied', () => {
  const r = engine.evaluateLike({ viewerId: 'a', targetId: 'b', targetExists: false });
  assert.equal(r.allowed, false);
  assert.equal(r.code, 'NOT_FOUND');
});

test('like: blocked either direction is denied', () => {
  const r = engine.evaluateLike({ viewerId: 'a', targetId: 'b', blockedEitherDirection: true });
  assert.equal(r.allowed, false);
  assert.equal(r.code, 'USER_BLOCKED');
});

test('like: duplicate like is denied', () => {
  const r = engine.evaluateLike({ viewerId: 'a', targetId: 'b', alreadyLiked: true });
  assert.equal(r.allowed, false);
  assert.equal(r.code, 'DUPLICATE_LIKE');
});

test('like: super-like uses LIKE_KIND.SUPER', () => {
  const r = engine.evaluateLike({ viewerId: 'a', targetId: 'b', kind: LIKE_KIND.SUPER });
  assert.equal(r.allowed, true);
  assert.equal(r.kind, LIKE_KIND.SUPER);
});

test('like: unknown kind is rejected', () => {
  const r = engine.evaluateLike({ viewerId: 'a', targetId: 'b', kind: 'fancy' });
  assert.equal(r.allowed, false);
  assert.equal(r.code, 'VALIDATION_FAILED');
});

test('pass: allowed', () => {
  const r = engine.evaluatePass({ viewerId: 'a', targetId: 'b' });
  assert.equal(r.allowed, true);
});

test('pass: self-pass is denied', () => {
  const r = engine.evaluatePass({ viewerId: 'a', targetId: 'a' });
  assert.equal(r.allowed, false);
  assert.equal(r.code, 'SELF_ACTION');
});

test('pass: duplicate pass is a noop not an error', () => {
  const r = engine.evaluatePass({ viewerId: 'a', targetId: 'b', alreadyPassed: true });
  assert.equal(r.allowed, false);
  assert.equal(r.noop, true);
});

test('pass: blocked is denied', () => {
  const r = engine.evaluatePass({ viewerId: 'a', targetId: 'b', blockedEitherDirection: true });
  assert.equal(r.allowed, false);
  assert.equal(r.code, 'USER_BLOCKED');
});

test('createsMatch: true only when target already liked viewer', () => {
  assert.equal(engine.createsMatch({ viewerId: 'a', targetId: 'b', targetLikedViewer: true }), true);
  assert.equal(engine.createsMatch({ viewerId: 'a', targetId: 'b', targetLikedViewer: false }), false);
  assert.equal(engine.createsMatch({ viewerId: 'a', targetId: 'a', targetLikedViewer: true }), false);
});
