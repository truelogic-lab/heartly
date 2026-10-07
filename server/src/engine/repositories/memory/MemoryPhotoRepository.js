import { PhotoRepository } from '../PhotoRepository.js';
import { newPhotoId } from '../../core/ids.js';

export class MemoryPhotoRepository extends PhotoRepository {
  constructor({ clock }) {
    super();
    this.clock = clock;
    this.byId = new Map();
  }

  async listByUserId(userId) {
    return Array.from(this.byId.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => a.order - b.order);
  }

  async add({ userId, url, isPrimary = false }) {
    const existing = await this.listByUserId(userId);
    const record = {
      id: newPhotoId(),
      userId,
      url,
      order: existing.length,
      isPrimary: isPrimary || existing.length === 0,
      createdAt: this.clock.now(),
    };
    this.byId.set(record.id, record);
    return record;
  }

  async delete(id) {
    return this.byId.delete(id);
  }

  async deleteAllForUser(userId) {
    for (const [id, p] of this.byId) {
      if (p.userId === userId) this.byId.delete(id);
    }
  }

  async countForUser(userId) {
    let n = 0;
    for (const p of this.byId.values()) if (p.userId === userId) n++;
    return n;
  }
}
