import { SafetyEngine } from '../domain/SafetyEngine.js';
import { DatingEngineError, ValidationError } from '../core/errors.js';

export class SafetyService {
  constructor({
    blockRepository,
    matchRepository,
    eventBus,
    clock,
  }) {
    this.blocks = blockRepository;
    this.matches = matchRepository;
    this.events = eventBus;
    this.clock = clock;
    this.engine = new SafetyEngine({ clock });
  }

  async block(viewerId, targetId) {
    if (!viewerId || !targetId) throw new ValidationError('viewerId and targetId required');

    const existing = await this.blocks.find(viewerId, targetId);
    const decision = this.engine.canBlock({
      viewerId,
      targetId,
      alreadyBlocked: Boolean(existing),
    });

    if (!decision.allowed && !decision.noop) {
      throw new DatingEngineError(decision.code, decision.reason || 'Block denied');
    }

    if (decision.noop) return existing;

    const payload = this.engine.prepareBlock({ viewerId, targetId });

    // Persist the block record (repository returns only the stored shape)
    const record = await this.blocks.add({
      blockerId: payload.blockerId,
      blockedId: payload.blockedId,
    });

    // Mark any existing match as blocked
    const match = await this.matches.findBetween(viewerId, targetId);
    if (match) await this.matches.update(match.id, { blocked: true });

    this.events?.publish(payload.event);
    return record;
  }

  async unblock(viewerId, targetId) {
    const existing = await this.blocks.find(viewerId, targetId);
    const decision = this.engine.canUnblock({
      viewerId,
      targetId,
      isBlocked: Boolean(existing),
    });

    if (!decision.allowed) {
      throw new DatingEngineError(decision.code, decision.reason || 'Unblock denied');
    }

    await this.blocks.remove(viewerId, targetId);

    const match = await this.matches.findBetween(viewerId, targetId);
    if (match) await this.matches.update(match.id, { blocked: false });

    const payload = this.engine.prepareUnblock({ viewerId, targetId });
    this.events?.publish(payload.event);
    return payload;
  }

  async report(viewerId, targetId, reason) {
    const decision = this.engine.canReport({ viewerId, targetId, reason });
    if (!decision.allowed) {
      throw new DatingEngineError(decision.code, decision.reason || 'Report denied');
    }
    // Reports are event-only for now — a repository will be added later.
    const payload = this.engine.prepareReport({ viewerId, targetId, reason });
    this.events?.publish(payload.event);
    return payload;
  }
}
