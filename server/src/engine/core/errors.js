/**
 * Heartly Dating Engine — typed errors.
 *
 * Every error the engine throws is a DatingEngineError with a
 * machine-readable code, so the future HTTP layer can map codes
 * to status codes without inspecting messages.
 */

import { ERROR_CODES } from './constants.js';

export class DatingEngineError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'DatingEngineError';
    this.code = code;
    this.details = details;
    this.isDatingEngineError = true;
  }
}

export class ValidationError extends DatingEngineError {
  constructor(message, details = {}) {
    super(ERROR_CODES.VALIDATION_FAILED, message, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DatingEngineError {
  constructor(resource = 'resource', details = {}) {
    super(ERROR_CODES.NOT_FOUND, `${resource} not found`, details);
    this.name = 'NotFoundError';
  }
}

export class BlockedError extends DatingEngineError {
  constructor(message = 'Action not allowed with blocked user', details = {}) {
    super(ERROR_CODES.USER_BLOCKED, message, details);
    this.name = 'BlockedError';
  }
}

export class DuplicateLikeError extends DatingEngineError {
  constructor(details = {}) {
    super(ERROR_CODES.DUPLICATE_LIKE, 'Duplicate like', details);
    this.name = 'DuplicateLikeError';
  }
}

export class DuplicateMatchError extends DatingEngineError {
  constructor(details = {}) {
    super(ERROR_CODES.DUPLICATE_MATCH, 'Match already exists', details);
    this.name = 'DuplicateMatchError';
  }
}

export class NotMatchedError extends DatingEngineError {
  constructor(details = {}) {
    super(ERROR_CODES.NOT_MATCHED, 'Users are not matched', details);
    this.name = 'NotMatchedError';
  }
}

export class SelfActionError extends DatingEngineError {
  constructor(message = 'Cannot perform this action on yourself', details = {}) {
    super(ERROR_CODES.SELF_ACTION, message, details);
    this.name = 'SelfActionError';
  }
}

export class MessageError extends DatingEngineError {
  constructor(code, message, details = {}) {
    super(code, message, details);
    this.name = 'MessageError';
  }
}

/* HTTP status mapping — the future API layer will use this */
export const ERROR_HTTP_STATUS = Object.freeze({
  [ERROR_CODES.VALIDATION_FAILED]: 400,
  [ERROR_CODES.PROFILE_INCOMPLETE]: 400,
  [ERROR_CODES.SELF_ACTION]: 400,
  [ERROR_CODES.USER_BLOCKED]: 403,
  [ERROR_CODES.DUPLICATE_LIKE]: 409,
  [ERROR_CODES.DUPLICATE_MATCH]: 409,
  [ERROR_CODES.NOT_MATCHED]: 403,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.MESSAGE_TOO_LONG]: 400,
  [ERROR_CODES.MESSAGE_EMPTY]: 400,
  [ERROR_CODES.PHOTO_LIMIT_REACHED]: 409,
  [ERROR_CODES.PHOTO_INVALID]: 400,
  [ERROR_CODES.PREFERENCE_INVALID]: 400,
});

export function toHttpStatus(error) {
  if (!error?.code) return 500;
  return ERROR_HTTP_STATUS[error.code] ?? 500;
}
