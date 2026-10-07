/**
 * Heartly Dating Engine — public API.
 *
 * Import only from this file. Internal modules are not part of the
 * stable surface and may change.
 */

export { createEngine } from './container.js';

export { EventBus } from './events/EventBus.js';

export { SystemClock, ManualClock, FixedClock, defaultClock } from './core/clock.js';

export {
  GENDERS,
  GENDER_VALUES,
  LOOKING_FOR,
  LOOKING_FOR_VALUES,
  INTENTIONS,
  INTENTION_VALUES,
  AGE,
  DISTANCE,
  PROFILE_LIMITS,
  PHOTO_LIMITS,
  MESSAGE_LIMITS,
  LIKE_KIND,
  RANKING_WEIGHTS,
  COMPATIBILITY_WEIGHTS,
  COMPLETENESS_WEIGHTS,
  ACTIVITY,
  ACTIVITY_STATE,
  DAILY_PICKS,
  EVENTS,
  ERROR_CODES,
} from './core/constants.js';

export {
  DatingEngineError,
  ValidationError,
  NotFoundError,
  BlockedError,
  DuplicateLikeError,
  DuplicateMatchError,
  NotMatchedError,
  SelfActionError,
  MessageError,
  toHttpStatus,
  ERROR_HTTP_STATUS,
} from './core/errors.js';

export { distanceKm, closenessScore } from './core/geo.js';
