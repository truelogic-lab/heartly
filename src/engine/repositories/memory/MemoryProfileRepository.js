import { ProfileRepository } from '../ProfileRepository.js';
import { newProfileId } from '../../core/ids.js';

export class MemoryProfileRepository extends ProfileRepository {
  constructor({ clock }) {
    super();
    this.clock = clock;
    this.byUserId = new Map();
  }

  async findByUserId(userId) {
    return this.byUserId.get(userId) ?? null;
  }

  async create({ userId, ...rest }) {
    const now = this.clock.now();
    const record = {
      id: newProfileId(),
      userId,
      name: rest.name ?? '',
      bio: rest.bio ?? '',
      birthdate: rest.birthdate ?? null,
      gender: rest.gender ?? null,
      lookingFor: rest.lookingFor ?? 'everyone',
      intention: rest.intention ?? null,
      location: rest.location ?? null,
      interests: rest.interests ? [...rest.interests] : [],
      preferences: rest.preferences ? { ...rest.preferences } : {},
      verified: rest.verified ?? false,
      deactivated: rest.deactivated ?? false,
      lastActiveAt: rest.lastActiveAt ?? now,
      photos: [],
      prompts: [],
      createdAt: now,
      updatedAt: now,
    };
    this.byUserId.set(userId, record);
    return record;
  }

  async update(userId, patch) {
    const current = this.byUserId.get(userId);
    if (!current) return null;
    const next = {
      ...current,
      ...patch,
      userId: current.userId,
      createdAt: current.createdAt,
      updatedAt: this.clock.now(),
    };
    this.byUserId.set(userId, next);
    return next;
  }

  async touchActive(userId, at) {
    const current = this.byUserId.get(userId);
    if (!current) return null;
    const next = { ...current, lastActiveAt: at, updatedAt: this.clock.now() };
    this.byUserId.set(userId, next);
    return next;
  }

  async listAll() {
    return Array.from(this.byUserId.values());
  }

  async listByIds(ids) {
    return ids.map((id) => this.byUserId.get(id)).filter(Boolean);
  }

  async count() {
    return this.byUserId.size;
  }
}
