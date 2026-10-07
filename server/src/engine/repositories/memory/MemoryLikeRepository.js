import { LikeRepository } from '../LikeRepository.js';
import { newLikeId } from '../../core/ids.js';

export class MemoryLikeRepository extends LikeRepository {
  constructor({ clock }) {
    super();
    this.clock = clock;
    this.likes = new Map();  // key: `${from}:${to}`
    this.passes = new Map(); // key: `${from}:${to}`
  }

  _k(from, to) { return `${from}:${to}`; }

  async addLike({ fromUserId, toUserId, kind = 'like' }) {
    const key = this._k(fromUserId, toUserId);
    if (this.likes.has(key)) return this.likes.get(key);
    const record = {
      id: newLikeId(),
      fromUserId,
      toUserId,
      kind,
      createdAt: this.clock.now(),
    };
    this.likes.set(key, record);
    return record;
  }

  async findLike(fromUserId, toUserId) {
    return this.likes.get(this._k(fromUserId, toUserId)) ?? null;
  }

  async hasLiked(fromUserId, toUserId) {
    return this.likes.has(this._k(fromUserId, toUserId));
  }

  async listOutbound(fromUserId) {
    return Array.from(this.likes.values())
      .filter((l) => l.fromUserId === fromUserId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async listInbound(toUserId) {
    return Array.from(this.likes.values())
      .filter((l) => l.toUserId === toUserId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async countOutbound(fromUserId) {
    return (await this.listOutbound(fromUserId)).length;
  }

  async countInbound(toUserId) {
    return (await this.listInbound(toUserId)).length;
  }

  async removeLike(fromUserId, toUserId) {
    return this.likes.delete(this._k(fromUserId, toUserId));
  }

  /* ---------- Passes ---------- */

  async addPass({ fromUserId, toUserId }) {
    const key = this._k(fromUserId, toUserId);
    if (this.passes.has(key)) return this.passes.get(key);
    const record = {
      id: newLikeId(),
      fromUserId,
      toUserId,
      createdAt: this.clock.now(),
    };
    this.passes.set(key, record);
    return record;
  }

  async hasPassed(fromUserId, toUserId) {
    return this.passes.has(this._k(fromUserId, toUserId));
  }

  async listPasses(fromUserId) {
    return Array.from(this.passes.values())
      .filter((p) => p.fromUserId === fromUserId);
  }

  async removePass(fromUserId, toUserId) {
    return this.passes.delete(this._k(fromUserId, toUserId));
  }
}
