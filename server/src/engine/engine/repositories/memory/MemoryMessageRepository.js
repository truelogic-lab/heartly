import { MessageRepository } from '../MessageRepository.js';
import { newMessageId } from '../../core/ids.js';

export class MemoryMessageRepository extends MessageRepository {
  constructor({ clock }) {
    super();
    this.clock = clock;
    this.byId = new Map();
  }

  async add({ matchId, senderId, body }) {
    const record = {
      id: newMessageId(),
      matchId,
      senderId,
      body,
      createdAt: this.clock.now(),
      read: false,
      readAt: 0,
    };
    this.byId.set(record.id, record);
    return record;
  }

  async listByMatch(matchId, { limit = 100, beforeMs } = {}) {
    return Array.from(this.byId.values())
      .filter((m) => m.matchId === matchId)
      .filter((m) => (beforeMs ? m.createdAt < beforeMs : true))
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-limit);
  }

  async countByMatch(matchId) {
    let n = 0;
    for (const m of this.byId.values()) if (m.matchId === matchId) n++;
    return n;
  }

  async markRead(matchId, readerId, at) {
    let updated = 0;
    for (const [id, m] of this.byId) {
      if (m.matchId === matchId && m.senderId !== readerId && !m.read) {
        this.byId.set(id, { ...m, read: true, readAt: at });
        updated++;
      }
    }
    return updated;
  }

  async delete(id) {
    return this.byId.delete(id);
  }

  async latestForMatch(matchId) {
    let latest = null;
    for (const m of this.byId.values()) {
      if (m.matchId === matchId && (!latest || m.createdAt > latest.createdAt)) {
        latest = m;
      }
    }
    return latest;
  }
}
