import { UserRepository } from '../UserRepository.js';
import { newUserId } from '../../core/ids.js';

export class MemoryUserRepository extends UserRepository {
  constructor({ clock }) {
    super();
    this.clock = clock;
    this.byId = new Map();
    this.byEmail = new Map();
  }

  async findById(id) {
    return this.byId.get(id) ?? null;
  }

  async findByEmail(email) {
    if (!email) return null;
    const id = this.byEmail.get(email.toLowerCase());
    return id ? this.byId.get(id) : null;
  }

  async create({ email, name, passwordHash }) {
    const now = this.clock.now();
    const id = newUserId();
    const record = {
      id,
      email: email?.toLowerCase() ?? '',
      name: name ?? '',
      passwordHash: passwordHash ?? null,
      createdAt: now,
      updatedAt: now,
      deactivated: false,
    };
    this.byId.set(id, record);
    if (record.email) this.byEmail.set(record.email, id);
    return record;
  }

  async update(id, patch) {
    const current = this.byId.get(id);
    if (!current) return null;
    const next = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: this.clock.now(),
    };
    if (patch.email && patch.email.toLowerCase() !== current.email) {
      this.byEmail.delete(current.email);
      next.email = patch.email.toLowerCase();
      this.byEmail.set(next.email, id);
    }
    this.byId.set(id, next);
    return next;
  }

  async delete(id) {
    const current = this.byId.get(id);
    if (!current) return false;
    this.byId.delete(id);
    this.byEmail.delete(current.email);
    return true;
  }

  async listByIds(ids) {
    return ids.map((id) => this.byId.get(id)).filter(Boolean);
  }

  async count() {
    return this.byId.size;
  }
}
