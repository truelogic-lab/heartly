/**
 * Heartly Dating Engine — constants.
 *
 * Every tunable number, enum, and default lives here so the engine
 * can be re-configured without touching business logic.
 */

/* =========================================================
   Gender & preferences
   ========================================================= */
export const GENDERS = Object.freeze({
  WOMAN: 'woman',
  MAN: 'man',
  NON_BINARY: 'non_binary',
  OTHER: 'other',
});

export const GENDER_VALUES = Object.freeze(Object.values(GENDERS));

/* Who a user is interested in seeing in discovery */
export const LOOKING_FOR = Object.freeze({
  WOMEN: 'women',
  MEN: 'men',
  EVERYONE: 'everyone',
});

export const LOOKING_FOR_VALUES = Object.freeze(Object.values(LOOKING_FOR));

/* Relationship intentions */
export const INTENTIONS = Object.freeze({
  LONG_TERM: 'long_term',
  SHORT_TERM: 'short_term',
  FRIENDS: 'friends',
  FIGURING_IT_OUT: 'figuring_it_out',
});

export const INTENTION_VALUES = Object.freeze(Object.values(INTENTIONS));

/* =========================================================
   Age limits
   ========================================================= */
export const AGE = Object.freeze({
  MIN: 18,
  MAX: 100,
  DEFAULT_MIN_PREFERENCE: 18,
  DEFAULT_MAX_PREFERENCE: 45,
});

/* =========================================================
   Distance
   ========================================================= */
export const DISTANCE = Object.freeze({
  MAX_KM: 500,
  DEFAULT_KM: 50,
});

/* =========================================================
   Profile limits
   ========================================================= */
export const PROFILE_LIMITS = Object.freeze({
  NAME_MIN: 2,
  NAME_MAX: 60,
  BIO_MAX: 500,
  INTERESTS_MAX: 10,
  PROMPTS_MAX: 3,
  PROMPT_ANSWER_MAX: 300,
});

/* =========================================================
   Photos
   ========================================================= */
export const PHOTO_LIMITS = Object.freeze({
  MIN: 1,
  MAX: 6,
  MAX_BYTES: 8 * 1024 * 1024,
  ALLOWED_MIME: ['image/jpeg', 'image/png', 'image/webp'],
});

/* =========================================================
   Messaging
   ========================================================= */
export const MESSAGE_LIMITS = Object.freeze({
  MIN_LENGTH: 1,
  MAX_LENGTH: 2000,
});

/* =========================================================
   Like kinds
   ========================================================= */
export const LIKE_KIND = Object.freeze({
  LIKE: 'like',
  SUPER: 'super_like',
});

/* =========================================================
   Discovery / ranking weights
   Tuning these changes the order of the discovery feed
   without touching the engine logic.
   ========================================================= */
export const RANKING_WEIGHTS = Object.freeze({
  DISTANCE: 0.30,       // closer = higher score
  COMPATIBILITY: 0.25,  // from CompatibilityEngine
  SHARED_INTERESTS: 0.15,
  PROFILE_QUALITY: 0.10,
  ACTIVITY: 0.12,       // recently active = higher
  VERIFICATION: 0.08,   // verified = higher
});

/* =========================================================
   Compatibility weights
   The CompatibilityEngine returns a 0–100 score computed
   from these factors. Not a scientific measure — just
   Heartly's recommendation score.
   ========================================================= */
export const COMPATIBILITY_WEIGHTS = Object.freeze({
  SHARED_INTERESTS: 30,
  AGE_PREFERENCE: 15,
  INTENTION: 20,
  DISTANCE: 15,
  PROFILE_COMPLETENESS: 10,
  PROMPT_SIMILARITY: 10,
});

/* =========================================================
   Profile completeness weights — must sum to 100
   ========================================================= */
export const COMPLETENESS_WEIGHTS = Object.freeze({
  NAME: 10,
  BIO: 15,
  BIRTHDATE: 10,
  GENDER: 5,
  LOCATION: 10,
  PHOTOS_MIN: 15,       // has at least PHOTO_LIMITS.MIN
  PHOTOS_FULL: 15,      // has PHOTO_LIMITS.MAX
  INTERESTS: 10,
  PROMPT: 5,
  VERIFIED: 5,
});

/* =========================================================
   Activity thresholds
   ========================================================= */
export const ACTIVITY = Object.freeze({
  ONLINE_WINDOW_MS: 5 * 60 * 1000,          // 5 minutes
  RECENTLY_ACTIVE_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  INACTIVE_WINDOW_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export const ACTIVITY_STATE = Object.freeze({
  ONLINE: 'online',
  RECENTLY_ACTIVE: 'recently_active',
  ACTIVE_TODAY: 'active_today',
  INACTIVE: 'inactive',
});

/* =========================================================
   Daily picks
   ========================================================= */
export const DAILY_PICKS = Object.freeze({
  COUNT: 4,
  MIN_COMPATIBILITY: 50, // only picks above this score
});

/* =========================================================
   Events
   ========================================================= */
export const EVENTS = Object.freeze({
  MATCH_CREATED: 'match.created',
  LIKE_CREATED: 'like.created',
  MESSAGE_SENT: 'message.sent',
  USER_BLOCKED: 'user.blocked',
  USER_UNBLOCKED: 'user.unblocked',
  USER_REPORTED: 'user.reported',
});

/* =========================================================
   Engine errors — codes
   ========================================================= */
export const ERROR_CODES = Object.freeze({
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
  SELF_ACTION: 'SELF_ACTION',
  USER_BLOCKED: 'USER_BLOCKED',
  DUPLICATE_LIKE: 'DUPLICATE_LIKE',
  DUPLICATE_MATCH: 'DUPLICATE_MATCH',
  NOT_MATCHED: 'NOT_MATCHED',
  NOT_FOUND: 'NOT_FOUND',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  MESSAGE_EMPTY: 'MESSAGE_EMPTY',
  PHOTO_LIMIT_REACHED: 'PHOTO_LIMIT_REACHED',
  PHOTO_INVALID: 'PHOTO_INVALID',
  PREFERENCE_INVALID: 'PREFERENCE_INVALID',
});
