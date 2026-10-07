/**
 * LikeService — orchestrates LikeEngine + MatchEngine + repositories.
 *
 * Given a like action:
 *   1. Evaluate with LikeEngine (rules: self, blocked, dup, kind)
 *   2. Persist the like
 *   3. Evaluate with MatchEngine (mutual?)
 *   4. If matched, persist the match and emit MATCH_CREATED
 */

import { LikeEngine } from '../domain/LikeEngine.js';
import { MatchEngine } from '../domain/MatchEngine.js';
import { LIKE_KIND, EVENTS } from '../core/constants.js';
import { ValidationError, NotFoundError, DatingEngineError } from '../core/errors.js';

export class LikeService {
  constructor({
    userRepository,
    profileRepository,
    likeRepository,
    matchRepository,
    blockRepository,
    eventBus,
    clock,
  }) {
    this.users = userRepository;
    this.profiles = profileRepository;
    this.likes = likeRepository;
    this.matches = matchRepository;
    this.blocks = blockRepository;
    this.events = eventBus;
    this.clock = clock;
    this.likeEngine = new LikeEngine();
    this.matchEngine = new MatchEngine({ clock });
  }

  /**
   * @returns {{ like, matched: boolean, match?: object, event?: object }}
   */
  async like(viewerId, targetId, kind = LIKE_KIND.LIKE) {
    if (!viewerId || !targetId) throw new ValidationError('viewerId and targetId required');

    const [targetUser, alreadyLiked, blockedEither] = await Promise.all([
      this.users.findById(targetId),
      this.likes.hasLiked(viewerId, targetId),
      this.blocks.isBlockedEitherDirection(viewerId, targetId),
    ]);

    const decision = this.likeEngine.evaluateLike({
      viewerId,
      targetId,
      targetExists: Boolean(targetUser),
      alreadyLiked,
      blockedEitherDirection: blockedEither,
      kind,
    });

    if (!decision.allowed) {
      throw new DatingEngineError(decision.code, decision.reason || 'Like denied');
    }

    const like = await this.likes.addLike({ fromUserId: viewerId, toUserId: targetId, kind });
    this.events?.publish({
      type: EVENTS.LIKE_CREATED,
      likeId: like.id,
      fromUserId: viewerId,
      toUserId: targetId,
      kind,
      at: like.createdAt,
    });

    // Did this create a match?
    const targetLikedViewer = await this.likes.hasLiked(targetId, viewerId);
    const existing = await this.matches.findBetween(viewerId, targetId);

    const mDecision = this.matchEngine.evaluate({
      viewerId,
      targetId,
      targetLikedViewer,
      alreadyMatched: Boolean(existing),
    });

    if (!mDecision.matched) {
      return { like, matched: false };
    }

    const match = await this.matches.create({
      id: mDecision.matchId,
      users: [viewerId, targetId],
    });

    this.events?.publish(mDecision.event);

    return { like, matched: true, match, event: mDecision.event };
  }

  async superLike(viewerId, targetId) {
    return this.like(viewerId, targetId, LIKE_KIND.SUPER);
  }

  async pass(viewerId, targetId) {
    if (!viewerId || !targetId) throw new ValidationError('viewerId and targetId required');

    const [targetUser, alreadyPassed, blockedEither] = await Promise.all([
      this.users.findById(targetId),
      this.likes.hasPassed(viewerId, targetId),
      this.blocks.isBlockedEitherDirection(viewerId, targetId),
    ]);

    const decision = this.likeEngine.evaluatePass({
      viewerId,
      targetId,
      targetExists: Boolean(targetUser),
      blockedEitherDirection: blockedEither,
      alreadyPassed,
    });

    if (decision.allowed) {
      return this.likes.addPass({ fromUserId: viewerId, toUserId: targetId });
    }

    if (decision.noop) return null;

    throw new DatingEngineError(decision.code, decision.reason || 'Pass denied');
  }

  /**
   * Who liked me (inbound), enriched with profiles.
   */
  async likesReceived(viewerId) {
    const inbound = await this.likes.listInbound(viewerId);
    const out = [];
    for (const l of inbound) {
      const p = await this.profiles.findByUserId(l.fromUserId);
      if (p) out.push({ like: l, profile: p });
    }
    return out;
  }

  /**
   * Who I liked (outbound).
   */
  async likesSent(viewerId) {
    const outbound = await this.likes.listOutbound(viewerId);
    const out = [];
    for (const l of outbound) {
      const p = await this.profiles.findByUserId(l.toUserId);
      if (p) out.push({ like: l, profile: p });
    }
    return out;
  }
}
