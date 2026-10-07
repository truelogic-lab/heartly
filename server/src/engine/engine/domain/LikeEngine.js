/**
 * LikeEngine — decision logic for like / pass / super-like.
 *
 * Pure. Given the current state, it says what the action means:
 *   { allowed, kind, reason?, createsMatch? }
 *
 * It does NOT write to storage. The LikeService orchestrates storage.
 */

import { LIKE_KIND } from '../core/constants.js';

export class LikeEngine {
  constructor({ blockRepository } = {}) {
    // Optional — if provided, blocked users are auto-excluded
    this.blockRepository = blockRepository || null;
  }

  /**
   * Decide whether viewer may like `targetId`.
   * @returns {{ allowed: boolean, code?: string, reason?: string, kind: string }}
   */
  evaluateLike({ viewerId, targetId, targetExists = true, alreadyLiked = false, blockedEitherDirection = false, kind = LIKE_KIND.LIKE }) {
    if (!viewerId || !targetId) {
      return deny('VALIDATION_FAILED', 'viewerId and targetId are required');
    }
    if (viewerId === targetId) {
      return deny('SELF_ACTION', 'Cannot like yourself');
    }
    if (!targetExists) {
      return deny('NOT_FOUND', 'Target user not found');
    }
    if (blockedEitherDirection) {
      return deny('USER_BLOCKED', 'Cannot like a blocked user');
    }
    if (alreadyLiked) {
      return deny('DUPLICATE_LIKE', 'You already liked this user');
    }
    if (kind !== LIKE_KIND.LIKE && kind !== LIKE_KIND.SUPER) {
      return deny('VALIDATION_FAILED', `Unknown like kind: ${kind}`);
    }
    return { allowed: true, kind };
  }

  /**
   * Decide whether viewer may pass on `targetId`.
   * Passing is more permissive than liking.
   */
  evaluatePass({ viewerId, targetId, targetExists = true, blockedEitherDirection = false, alreadyPassed = false }) {
    if (!viewerId || !targetId) {
      return deny('VALIDATION_FAILED', 'viewerId and targetId are required');
    }
    if (viewerId === targetId) {
      return deny('SELF_ACTION', 'Cannot pass yourself');
    }
    if (!targetExists) {
      return deny('NOT_FOUND', 'Target user not found');
    }
    if (blockedEitherDirection) {
      return deny('USER_BLOCKED', 'Cannot pass a blocked user');
    }
    if (alreadyPassed) {
      // Pass on a pass is a no-op, not an error
      return { allowed: false, code: 'DUPLICATE_PASS', reason: 'Already passed', noop: true };
    }
    return { allowed: true };
  }

  /**
   * Given the viewer's outbound like and the target's outbound like (if any),
   * does this action create a match?
   */
  createsMatch({ viewerId, targetId, targetLikedViewer }) {
    if (!viewerId || !targetId || viewerId === targetId) return false;
    return targetLikedViewer === true;
  }
}

function deny(code, reason) {
  return { allowed: false, code, reason };
}
