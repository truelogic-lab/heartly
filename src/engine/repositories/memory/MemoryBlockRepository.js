import { BlockRepository } from '../BlockRepository.js';
import { newBlockId } from '../../core/ids.js';

export class MemoryBlockRepository extends BlockRepository {
  constructor({ clock }) {
    super();
    this.clock = clock;
    this.byKey = new Map();
  }

  _k(a, b) { return `${a}:${b}`; }

  async add({ blockerId, blockedId }) {
    const key = this._k(blockerId, blockedId);
    if (this.byKey.has(key)) return this.byKey.get(key);
    const record = {
      id: newBlockId(),
      blockerId,
      blockedId,
      createdAt: this.clock.now(),
    };
    this.byKey.set(key, record);
    return record;
  }

  async find(blockerId, blockedId) {
    return this.byKey.get(this._k(blockerId, blockedId)) ?? null;
  }

  async isBlockedEitherDirection(a, b) {
    return (
      this.byKey.has(this._k(a, b)) || this.byKey.has(this._k(b, a))
    );
  }

  async listByBlocker(blockerId) {
    return Array.from(this.byKey.values()).filter((b) => b.blockerId === blockerId);
  }

  async listInvolvingUser(userId) {
    return Array.from(this.byKey.values())
      .filter((b) => b.blockerId === userId || b.blockedId === userId);
  }

  async remove(blockerId, blockedId) {
    return this.byKey.delete(this._k(blockerId, blockedId));
  }
}
