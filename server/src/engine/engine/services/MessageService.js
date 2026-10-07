import { MessagingEngine } from '../domain/MessagingEngine.js';
import { EVENTS } from '../core/constants.js';
import { DatingEngineError, NotFoundError, ValidationError } from '../core/errors.js';

export class MessageService {
  constructor({
    messageRepository,
    matchRepository,
    blockRepository,
    profileRepository,
    eventBus,
    clock,
  }) {
    this.messages = messageRepository;
    this.matches = matchRepository;
    this.blocks = blockRepository;
    this.profiles = profileRepository;
    this.events = eventBus;
    this.clock = clock;
    this.engine = new MessagingEngine({ clock });
  }

  async getConversation(matchId, viewerId, options = {}) {
    if (!matchId || !viewerId) throw new ValidationError('matchId and viewerId required');
    const match = await this.matches.findById(matchId);
    if (!match) throw new NotFoundError('match');

    const list = await this.messages.listByMatch(matchId, options);
    return { match, messages: list };
  }

  async send(matchId, senderId, body) {
    if (!matchId || !senderId) throw new ValidationError('matchId and senderId required');

    const match = await this.matches.findById(matchId);
    if (!match) throw new NotFoundError('match');

    // Check whether either user has blocked the other
    const other = match.users.find((u) => u !== senderId);
    const blocked = other
      ? await this.blocks.isBlockedEitherDirection(senderId, other)
      : false;

    const decision = this.engine.canSendMessage({
      senderId,
      match,
      blockedEitherDirection: blocked,
    });
    if (!decision.allowed) {
      throw new DatingEngineError(decision.code, decision.reason || 'Cannot send message');
    }

    const prepared = this.engine.prepare({ matchId, senderId, body });
    const record = await this.messages.add(prepared);

    // Update match preview
    await this.matches.update(matchId, {
      lastMessageAt: record.createdAt,
      lastMessagePreview: this.engine.preview(record),
    });

    this.events?.publish({
      type: EVENTS.MESSAGE_SENT,
      messageId: record.id,
      matchId,
      senderId,
      at: record.createdAt,
    });

    return record;
  }

  async markRead(matchId, readerId) {
    return this.messages.markRead(matchId, readerId, this.clock.now());
  }
}
