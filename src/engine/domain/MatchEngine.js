/**
 * MatchEngine — detects and records mutual-like matches.
 *
 * Pure decision logic:
 *   - Given two outbound likes, decide whether they form a match
 *   - Given an existing match set, decide whether a new match is a duplicate
 *   - Generate a stable match ID from a pair of user IDs
 *   - Produce a MATCH_CREATED event payload
 *
 * The MatchService writes the match via the MatchRepository (Message 6).
 */

import { EVENTS } from '../core/constants.js';

export class MatchEngine {
  constructor({ clock }) {
    if (!clock) throw new Error('MatchEngine requires a clock');
    this.clock = clock;
  }

  /**
   * Deterministic match id for a pair of users.
   * Order-independent — same id whether you pass (A,B) or (B,A).
   */
  pairId(userA, userB) {
    const [a, b] = [String(userA), String(userB)].sort();
    return `match_${a}__${b}`;
  }

  /**
   * Decide whether a like from A→B forms a match.
   * @param {object} args
   * @param {string} args.viewerId
   * @param {string} args.targetId
   * @param {boolean} args.targetLikedViewer — is there a like B→A already?
   * @param {boolean} args.alreadyMatched — do A and B already have a match record?
   * @returns {{ matched: boolean, reason?: string, matchId?: string, event?: object }}
   */
  evaluate({ viewerId, targetId, targetLikedViewer, alreadyMatched = false }) {
    if (!viewerId || !targetId) {
      return { matched: false, reason: 'VALIDATION_FAILED' };
    }
    if (viewerId === targetId) {
      return { matched: false, reason: 'SELF_ACTION' };
    }
    if (!targetLikedViewer) {
      return { matched: false, reason: 'ONE_SIDED' };
    }
    if (alreadyMatched) {
      return { matched: false, reason: 'DUPLICATE_MATCH' };
    }

    const matchId = this.pairId(viewerId, targetId);
    const event = {
      type: EVENTS.MATCH_CREATED,
      matchId,
      users: [viewerId, targetId].sort(),
      createdAt: this.clock.now(),
    };

    return { matched: true, matchId, event };
  }

  /**
   * Given a match record, return the OTHER user id from the viewer's perspective.
   */
  otherUser(match, viewerId) {
    if (!match || !Array.isArray(match.users)) return null;
    if (!match.users.includes(viewerId)) return null;
    return match.users.find((u) => u !== viewerId) ?? null;
  }

  /**
   * Given a match record, is this viewer a participant?
   */
  includes(match, userId) {
    return Boolean(match?.users?.includes(userId));
  }
}
