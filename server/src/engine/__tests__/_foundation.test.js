import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  GENDERS,
  AGE,
  ERROR_CODES,
  EVENTS,
} from '../core/constants.js';

import {
  DatingEngineError,
  ValidationError,
  toHttpStatus,
} from '../core/errors.js';

import {
  FixedClock,
  ManualClock,
} from '../core/clock.js';

import {
  validateAge,
  validateGender,
  validateBio,
  validateMessage,
  ageFromBirthdate,
} from '../core/validators.js';

import { newUserId } from '../core/ids.js';
import { distanceKm, closenessScore } from '../core/geo.js';

test('constants are frozen and complete', () => {
  assert.equal(GENDERS.WOMAN, 'woman');
  assert.equal(AGE.MIN, 18);
  assert.ok(ERROR_CODES.VALIDATION_FAILED);
  assert.equal(EVENTS.MATCH_CREATED, 'match.created');
});

test('errors carry codes and map to HTTP status', () => {
  const e = new ValidationError('bad input');
  assert.equal(e.code, ERROR_CODES.VALIDATION_FAILED);
  assert.equal(e.isDatingEngineError, true);
  assert.equal(toHttpStatus(e), 400);
});

test('clocks are injectable and deterministic', () => {
  const manual = new ManualClock(1000);
  assert.equal(manual.now(), 1000);
  manual.tick(500);
  assert.equal(manual.now(), 1500);

  const fixed = new FixedClock(9999);
  assert.equal(fixed.now(), 9999);
});

test('validateAge enforces 18-100', () => {
  assert.equal(validateAge(18), 18);
  assert.equal(validateAge(100), 100);
  assert.throws(() => validateAge(17));
  assert.throws(() => validateAge(101));
  assert.throws(() => validateAge('25'));
});

test('validateGender accepts only known genders', () => {
  assert.equal(validateGender('woman'), 'woman');
  assert.throws(() => validateGender('unknown'));
});

test('validateBio enforces max length', () => {
  assert.equal(validateBio(''), '');
  assert.equal(validateBio('hello'), 'hello');
  assert.throws(() => validateBio('x'.repeat(1000)));
});

test('validateMessage rejects empty and oversized', () => {
  assert.equal(validateMessage('  hi  '), 'hi');
  assert.throws(() => validateMessage(''));
  assert.throws(() => validateMessage('   '));
  assert.throws(() => validateMessage('x'.repeat(3000)));
});

test('ageFromBirthdate derives age deterministically', () => {
  // Birthdate: 2000-01-01
  const birth = Date.UTC(2000, 0, 1);
  // Now: 2025-06-15
  const now = Date.UTC(2025, 5, 15);
  assert.equal(ageFromBirthdate(birth, now), 25);

  // Day before birthday in 2025
  const before = Date.UTC(2025, 0, 1) - 24 * 60 * 60 * 1000; // 2024-12-31
  assert.equal(ageFromBirthdate(birth, before), 24);
});

test('newUserId returns a prefixed id', () => {
  const id = newUserId();
  assert.ok(id.startsWith('usr_'));
  assert.ok(id.length > 8);
});

test('distanceKm computes real distance', () => {
  // Nairobi to Mombasa ~ 440 km
  const nairobi = { lat: -1.2921, lng: 36.8219 };
  const mombasa = { lat: -4.0435, lng: 39.6682 };
  const d = distanceKm(nairobi, mombasa);
  assert.ok(d > 400 && d < 480, `expected ~440 km, got ${d}`);
});

test('closenessScore returns 1 at 0 km and 0 at maxDistance', () => {
  assert.equal(closenessScore(0, 50), 1);
  assert.equal(closenessScore(50, 50), 0);
  assert.ok(closenessScore(25, 50) > 0.4 && closenessScore(25, 50) < 0.6);
});
