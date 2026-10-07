/**
 * Heartly Dating Engine — validators.
 *
 * All validators are pure functions: they either return a normalized
 * value or throw a ValidationError. They never touch the database.
 */

import {
  AGE,
  DISTANCE,
  GENDERS,
  GENDER_VALUES,
  INTENTIONS,
  INTENTION_VALUES,
  LOOKING_FOR,
  LOOKING_FOR_VALUES,
  MESSAGE_LIMITS,
  PHOTO_LIMITS,
  PROFILE_LIMITS,
} from './constants.js';
import { ValidationError } from './errors.js';

/* ---------------------------------------------------------
   Primitives
   --------------------------------------------------------- */

export function assertString(value, field, { min = 0, max = Infinity, trim = true } = {}) {
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string`, { field });
  }
  const v = trim ? value.trim() : value;
  if (v.length < min) {
    throw new ValidationError(`${field} must be at least ${min} characters`, { field, min });
  }
  if (v.length > max) {
    throw new ValidationError(`${field} must be at most ${max} characters`, { field, max });
  }
  return v;
}

export function assertInt(value, field, { min = -Infinity, max = Infinity } = {}) {
  if (!Number.isInteger(value)) {
    throw new ValidationError(`${field} must be an integer`, { field });
  }
  if (value < min || value > max) {
    throw new ValidationError(`${field} must be between ${min} and ${max}`, { field });
  }
  return value;
}

export function assertNumber(value, field, { min = -Infinity, max = Infinity } = {}) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ValidationError(`${field} must be a number`, { field });
  }
  if (value < min || value > max) {
    throw new ValidationError(`${field} must be between ${min} and ${max}`, { field });
  }
  return value;
}

export function assertOneOf(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw new ValidationError(`${field} must be one of: ${allowed.join(', ')}`, {
      field,
      allowed,
    });
  }
  return value;
}

export function assertArray(value, field, { max = Infinity } = {}) {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${field} must be an array`, { field });
  }
  if (value.length > max) {
    throw new ValidationError(`${field} can have at most ${max} items`, { field, max });
  }
  return value;
}

/* ---------------------------------------------------------
   Domain-specific validators
   --------------------------------------------------------- */

export function validateAge(age) {
  return assertInt(age, 'age', { min: AGE.MIN, max: AGE.MAX });
}

/**
 * Age is always derived from birthdate, never stored directly.
 * This keeps the source of truth single and correctable.
 */
export function ageFromBirthdate(birthdateMs, nowMs) {
  const d = new Date(birthdateMs);
  const n = new Date(nowMs);
  if (Number.isNaN(d.getTime())) {
    throw new ValidationError('birthdate is invalid');
  }
  let age = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) age--;
  return validateAge(age);
}

export function validateGender(gender) {
  return assertOneOf(gender, GENDER_VALUES, 'gender');
}

export function validateLookingFor(value) {
  return assertOneOf(value, LOOKING_FOR_VALUES, 'lookingFor');
}

export function validateIntention(value) {
  return assertOneOf(value, INTENTION_VALUES, 'intention');
}

export function validateBio(bio) {
  if (bio == null || bio === '') return '';
  return assertString(bio, 'bio', { max: PROFILE_LIMITS.BIO_MAX });
}

export function validateName(name) {
  return assertString(name, 'name', {
    min: PROFILE_LIMITS.NAME_MIN,
    max: PROFILE_LIMITS.NAME_MAX,
  });
}

export function validateInterests(interests) {
  assertArray(interests, 'interests', { max: PROFILE_LIMITS.INTERESTS_MAX });
  const seen = new Set();
  const clean = [];
  for (const raw of interests) {
    const s = assertString(raw, 'interest', { min: 1, max: 40 }).toLowerCase();
    if (!seen.has(s)) {
      seen.add(s);
      clean.push(s);
    }
  }
  return clean;
}

export function validateAgePreference({ minAge, maxAge }) {
  assertInt(minAge, 'minAge', { min: AGE.MIN, max: AGE.MAX });
  assertInt(maxAge, 'maxAge', { min: AGE.MIN, max: AGE.MAX });
  if (minAge > maxAge) {
    throw new ValidationError('minAge must be <= maxAge', { minAge, maxAge });
  }
  return { minAge, maxAge };
}

export function validateDistancePreference(km) {
  return assertNumber(km, 'maxDistanceKm', { min: 1, max: DISTANCE.MAX_KM });
}

export function validateLocation({ lat, lng } = {}) {
  assertNumber(lat, 'lat', { min: -90, max: 90 });
  assertNumber(lng, 'lng', { min: -180, max: 180 });
  return { lat, lng };
}

export function validateMessage(body) {
  if (typeof body !== 'string') {
    throw new ValidationError('message body must be a string', { field: 'body' });
  }
  const trimmed = body.trim();
  if (trimmed.length < MESSAGE_LIMITS.MIN_LENGTH) {
    throw new ValidationError('message cannot be empty', { code: 'MESSAGE_EMPTY' });
  }
  if (trimmed.length > MESSAGE_LIMITS.MAX_LENGTH) {
    throw new ValidationError(
      `message must be at most ${MESSAGE_LIMITS.MAX_LENGTH} characters`,
      { code: 'MESSAGE_TOO_LONG', max: MESSAGE_LIMITS.MAX_LENGTH }
    );
  }
  return trimmed;
}

export function validatePhoto({ mimeType, sizeBytes } = {}) {
  if (!PHOTO_LIMITS.ALLOWED_MIME.includes(mimeType)) {
    throw new ValidationError(
      `photo mimeType must be one of: ${PHOTO_LIMITS.ALLOWED_MIME.join(', ')}`,
      { field: 'mimeType' }
    );
  }
  assertInt(sizeBytes, 'sizeBytes', { min: 1, max: PHOTO_LIMITS.MAX_BYTES });
  return { mimeType, sizeBytes };
}

/* ---------------------------------------------------------
   Composite — full profile payload
   --------------------------------------------------------- */

export function validateProfileInput(input = {}) {
  const out = {};
  if (input.name != null) out.name = validateName(input.name);
  if (input.bio != null) out.bio = validateBio(input.bio);
  if (input.gender != null) out.gender = validateGender(input.gender);
  if (input.lookingFor != null) out.lookingFor = validateLookingFor(input.lookingFor);
  if (input.intention != null) out.intention = validateIntention(input.intention);
  if (input.interests != null) out.interests = validateInterests(input.interests);
  if (input.birthdate != null) {
    const ms = typeof input.birthdate === 'number'
      ? input.birthdate
      : Date.parse(input.birthdate);
    if (Number.isNaN(ms)) {
      throw new ValidationError('birthdate is invalid', { field: 'birthdate' });
    }
    out.birthdate = ms;
  }
  if (input.location != null) out.location = validateLocation(input.location);
  if (input.preferences != null) {
    const p = input.preferences;
    const prefs = {};
    if (p.minAge != null || p.maxAge != null) {
      Object.assign(prefs, validateAgePreference({
        minAge: p.minAge ?? AGE.MIN,
        maxAge: p.maxAge ?? AGE.MAX,
      }));
    }
    if (p.maxDistanceKm != null) {
      prefs.maxDistanceKm = validateDistancePreference(p.maxDistanceKm);
    }
    if (p.lookingFor != null) {
      prefs.lookingFor = validateLookingFor(p.lookingFor);
    }
    out.preferences = prefs;
  }
  return out;
}
