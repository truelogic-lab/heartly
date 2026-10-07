/**
 * SafetyEngine — block, unblock, report decision logic.
 *
 * The engine decides whether an action is allowed and what its
 * consequences are. The SafetyService (Message 6) persists the action.
 *
 * Consequences of blocking:
 *   - The blocked user disappears from:
 *       discovery, daily picks, online now, likes, matches, chat
 *   - If a match existed, it becomes read-only for both users
 *     (we do not delete data — we mark it blocked)
 */

import { EVENTS } from '../core/constants.js';

const MAX_REPORT_REASON = 500;

export class SafetyEngine {
  constructor({ clock }) {
    if (!clock) throw new Error('SafetyEngine requires a clock');
    this.clock = clock;
  }

  /**
   * Decide whether the viewer may block `targetId`.
   */
  canBlock({ viewerId, targetId, alreadyBlocked = false }) {
    if (!viewerId || !targetId) {
      return deny('VALIDATION_FAILED', 'viewerId and targetId are required');
    }
    if (viewerId === targetId) {
      return deny('SELF_ACTION', 'Cannot block yourself');
    }
    if (alreadyBlocked) {
      return { allowed: false, code: 'DUPLICATE_BLOCK', noop: true, reason: 'Already blocked' };
    }
    return { allowed: true };
  }

  /**
   * Decide whether the viewer may unblock `targetId`.
   */
  canUnblock({ viewerId, targetId, isBlocked = false }) {
    if (!viewerId || !targetId) {
      return deny('VALIDATION_FAILED', 'viewerId and targetId are required');
    }
    if (viewerId === targetId) {
      return deny('SELF_ACTION', 'Cannot unblock yourself');
    }
    if (!isBlocked) {
      return { allowed: false, code: 'NOT_FOUND', reason: 'No active block' };
    }
    return { allowed: true };
  }

  /**
   * Prepare a block record.
   */
  prepareBlock({ viewerId, targetId }) {
    return {
      blockerId: viewerId,
      blockedId: targetId,
      createdAt: this.clock.now(),
      event: {
        type: EVENTS.USER_BLOCKED,
        blockerId: viewerId,
        blockedId: targetId,
        createdAt: this.clock.now(),
      },
    };
  }

  /**
   * Prepare an unblock record.
   */
  prepareUnblock({ viewerId, targetId }) {
    return {
      blockerId: viewerId,
      blockedId: targetId,
      at: this.clock.now(),
      event: {
        type: EVENTS.USER_UNBLOCKED,
        blockerId: viewerId,
        blockedId: targetId,
        at: this.clock.now(),
      },
    };
  }

  /**
   * Decide whether the viewer may report `targetId`.
   * Reporting is always allowed unless it's self-report (which is meaningless).
   */
  canReport({ viewerId, targetId, reason }) {
    if (!viewerId || !targetId) {
      return deny('VALIDATION_FAILED', 'viewerId and targetId are required');
    }
    if (viewerId === targetId) {
      return deny('SELF_ACTION', 'Cannot report yourself');
    }
    if (typeof reason !== 'string' || reason.trim().length === 0) {
      return deny('VALIDATION_FAILED', 'Report reason is required');
    }
    if (reason.length > MAX_REPORT_REASON) {
      return deny('VALIDATION_FAILED', `Reason must be at most ${MAX_REPORT_REASON} characters`);
    }
    return { allowed: true };
  }

  /**
   * Prepare a report record.
   */
  prepareReport({ viewerId, targetId, reason }) {
    return {
      reporterId: viewerId,
      reportedId: targetId,
      reason: reason.trim(),
      createdAt: this.clock.now(),
      event: {
        type: EVENTS.USER_REPORTED,
        reporterId: viewerId,
        reportedId: targetId,
        reason: reason.trim(),
        createdAt: this.clock.now(),
      },
    };
  }
}

function deny(code, reason) {
  return { allowed: false, code, reason };
}
