import { MatchRepository } from '../MatchRepository.js';

export class MemoryMatchRepository extends MatchRepository {
  constructor({ clock }) {
    super();
    this.clock = clock;
    this.byId = new Map();
  }

  _pairKey(a, b) {
    return [a, b].sort().join('__');
  }

  async findById(id) {
    return this.byId.get(id) ?? null;
  }

  async findBetween(userA, userB) {
    const [a, b] = [userA, userB].sort();
    for (const m of this.byId.values()) {
      if (m.users[0] === a && m.users[1] === b) return m;
    }
    return null;
  }

  async create({ id, users, blocked = false, deleted = false }) {
    if (this.byId.has(id)) return this.byId.get(id);
    const sorted = [...users].sort();
    const record = {
      id,
      users: sorted,
      createdAt: this.clock.now(),
      lastMessageAt: 0,
      lastMessagePreview: '',
      blocked,
      deleted,
    };
    this.byId.set(id, record);
    return record;
  }

  async listForUser(userId) {
    return Array.from(this.byId.values())
      .filter((m) => m.users.includes(userId) && !m.deleted)
      .sort((a, b) => (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt));
  }

  async update(id, patch) {
    const current = this.byId.get(id);
    if (!current) return null;
    const next = { ...current, ...patch, id: current.id, users: current.users };
    this.byId.set(id, next);
    return next;
  }

  async softDelete(id) {
    return this.update(id, { deleted: true });
  }

  async countForUser(userId) {
    return (await this.listForUser(userId)).length;
  }
}
