import { PromptRepository } from '../PromptRepository.js';

export class MemoryPromptRepository extends PromptRepository {
  constructor({ clock }) {
    super();
    this.clock = clock;
    this.byKey = new Map(); // `${userId}:${promptId}`
  }

  _k(userId, promptId) { return `${userId}:${promptId}`; }

  async listByUserId(userId) {
    return Array.from(this.byKey.values()).filter((p) => p.userId === userId);
  }

  async upsert({ userId, promptId, answer }) {
    const key = this._k(userId, promptId);
    const existing = this.byKey.get(key);
    const record = existing
      ? { ...existing, answer, updatedAt: this.clock.now() }
      : {
          id: `${userId}:${promptId}`,
          userId,
          promptId,
          answer,
          createdAt: this.clock.now(),
        };
    this.byKey.set(key, record);
    return record;
  }

  async delete(userId, promptId) {
    return this.byKey.delete(this._k(userId, promptId));
  }

  async countForUser(userId) {
    return (await this.listByUserId(userId)).length;
  }
}
