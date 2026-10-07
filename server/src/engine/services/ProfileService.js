/**
 * ProfileService — orchestrates ProfileEngine + repositories.
 * Also builds the "enriched profile" object the app consumes
 * (profile + photos + prompts merged).
 */

import { ProfileEngine } from '../domain/ProfileEngine.js';
import { NotFoundError, ValidationError } from '../core/errors.js';
import { validateProfileInput } from '../core/validators.js';

export class ProfileService {
  constructor({ profileRepository, photoRepository, promptRepository, clock }) {
    this.profiles = profileRepository;
    this.photos = photoRepository;
    this.prompts = promptRepository;
    this.clock = clock;
    this.engine = new ProfileEngine({ clock });
  }

  /**
   * Full enriched profile for a user — merges profile + photos + prompts.
   */
  async getEnriched(userId) {
    if (!userId) throw new ValidationError('userId is required');
    const profile = await this.profiles.findByUserId(userId);
    if (!profile) throw new NotFoundError('profile');
    const [photos, prompts] = await Promise.all([
      this.photos.listByUserId(userId),
      this.prompts.listByUserId(userId),
    ]);
    return this._enrich(profile, photos, prompts);
  }

  /**
   * List enriched profiles for the given user ids.
   * Missing profiles are silently skipped.
   */
  async listEnriched(userIds = []) {
    const out = [];
    for (const id of userIds) {
      const profile = await this.profiles.findByUserId(id);
      if (!profile) continue;
      const [photos, prompts] = await Promise.all([
        this.photos.listByUserId(id),
        this.prompts.listByUserId(id),
      ]);
      out.push(this._enrich(profile, photos, prompts));
    }
    return out;
  }

  async ensureProfile(userId, initial = {}) {
    const existing = await this.profiles.findByUserId(userId);
    if (existing) return this.getEnriched(userId);
    await this.profiles.create({ userId, ...initial });
    return this.getEnriched(userId);
  }

  /**
   * Update a profile with validated data.
   * Deep-merges preferences.
   */
  async update(userId, patch) {
    const current = await this.profiles.findByUserId(userId);
    if (!current) throw new NotFoundError('profile');

    const clean = validateProfileInput(patch);

    const merged = { ...clean };
    if (clean.preferences) {
      merged.preferences = { ...(current.preferences || {}), ...clean.preferences };
    }

    await this.profiles.update(userId, merged);
    return this.getEnriched(userId);
  }

  /**
   * Bump lastActiveAt for a user. Called on any meaningful request.
   */
  async touch(userId) {
    return this.profiles.touchActive(userId, this.clock.now());
  }

  completeness(enrichedProfile) {
    return this.engine.completeness(enrichedProfile);
  }

  quality(enrichedProfile) {
    return this.engine.quality(enrichedProfile);
  }

  activityState(enrichedProfile) {
    return this.engine.activityState(enrichedProfile);
  }

  recencyScore(enrichedProfile) {
    return this.engine.recencyScore(enrichedProfile);
  }

  isOnline(enrichedProfile) {
    return this.engine.isOnline(enrichedProfile);
  }

  _enrich(profile, photos, prompts) {
    return {
      ...profile,
      photos,
      prompts: prompts.map((p) => ({ promptId: p.promptId, answer: p.answer })),
    };
  }
}
