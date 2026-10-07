/**
 * ProfileEngine — profile completeness, quality, activity state.
 *
 * Pure. No I/O. The engine receives a profile object and returns derived
 * values. It never reads or writes to storage.
 */

import {
  ACTIVITY,
  ACTIVITY_STATE,
  COMPLETENESS_WEIGHTS,
  PHOTO_LIMITS,
  PROFILE_LIMITS,
} from '../core/constants.js';

export class ProfileEngine {
  constructor({ clock }) {
    if (!clock) throw new Error('ProfileEngine requires a clock');
    this.clock = clock;
  }

  /**
   * Compute profile completeness (0–100).
   * Weights live in constants so we can tune without touching logic.
   */
  completeness(profile) {
    if (!profile) return 0;
    let score = 0;

    if (profile.name && profile.name.trim().length >= 2) {
      score += COMPLETENESS_WEIGHTS.NAME;
    }
    if (profile.bio && profile.bio.trim().length > 0) {
      score += COMPLETENESS_WEIGHTS.BIO;
    }
    if (profile.birthdate) {
      score += COMPLETENESS_WEIGHTS.BIRTHDATE;
    }
    if (profile.gender) {
      score += COMPLETENESS_WEIGHTS.GENDER;
    }
    if (profile.location?.lat != null && profile.location?.lng != null) {
      score += COMPLETENESS_WEIGHTS.LOCATION;
    }

    const photos = Array.isArray(profile.photos) ? profile.photos.length : 0;
    if (photos >= PHOTO_LIMITS.MIN) {
      score += COMPLETENESS_WEIGHTS.PHOTOS_MIN;
    }
    if (photos >= PHOTO_LIMITS.MAX) {
      score += COMPLETENESS_WEIGHTS.PHOTOS_FULL;
    }

    const interests = Array.isArray(profile.interests) ? profile.interests.length : 0;
    if (interests >= 3) {
      score += COMPLETENESS_WEIGHTS.INTERESTS;
    }

    const prompts = Array.isArray(profile.prompts) ? profile.prompts.length : 0;
    if (prompts >= PROFILE_LIMITS.PROMPTS_MAX) {
      score += COMPLETENESS_WEIGHTS.PROMPT;
    }

    if (profile.verified) {
      score += COMPLETENESS_WEIGHTS.VERIFIED;
    }

    return Math.min(100, score);
  }

  /**
   * Quality score — a bounded 0–1 value used by ranking.
   * Combines completeness, photo count, bio length, and verification.
   */
  quality(profile) {
    if (!profile) return 0;
    const completeness = this.completeness(profile) / 100;

    const photos = Array.isArray(profile.photos) ? profile.photos.length : 0;
    const photoScore = Math.min(1, photos / PHOTO_LIMITS.MAX);

    const bioLen = profile.bio?.length ?? 0;
    const bioScore = Math.min(1, bioLen / PROFILE_LIMITS.BIO_MAX);

    const interests = Array.isArray(profile.interests) ? profile.interests.length : 0;
    const interestScore = Math.min(1, interests / PROFILE_LIMITS.INTERESTS_MAX);

    const verifiedScore = profile.verified ? 1 : 0;

    // Weighted mix — tune later if needed
    return clamp01(
      completeness * 0.45 +
      photoScore * 0.25 +
      bioScore * 0.10 +
      interestScore * 0.10 +
      verifiedScore * 0.10
    );
  }

  /**
   * Derive activity state from lastActiveAt.
   * Returns one of: online | recently_active | active_today | inactive
   */
  activityState(profile) {
    if (!profile?.lastActiveAt) return ACTIVITY_STATE.INACTIVE;
    const delta = this.clock.now() - profile.lastActiveAt;

    if (delta <= ACTIVITY.ONLINE_WINDOW_MS) return ACTIVITY_STATE.ONLINE;
    if (delta <= ACTIVITY.RECENTLY_ACTIVE_WINDOW_MS) return ACTIVITY_STATE.RECENTLY_ACTIVE;
    if (delta <= ACTIVITY.INACTIVE_WINDOW_MS) return ACTIVITY_STATE.ACTIVE_TODAY;
    return ACTIVITY_STATE.INACTIVE;
  }

  isOnline(profile) {
    return this.activityState(profile) === ACTIVITY_STATE.ONLINE;
  }

  isInactive(profile) {
    return this.activityState(profile) === ACTIVITY_STATE.INACTIVE;
  }

  /**
   * Recency score — 0 (old) to 1 (just now).
   * Used by the RankingEngine.
   */
  recencyScore(profile) {
    if (!profile?.lastActiveAt) return 0;
    const delta = Math.max(0, this.clock.now() - profile.lastActiveAt);
    const max = ACTIVITY.INACTIVE_WINDOW_MS;
    if (delta >= max) return 0;
    return 1 - delta / max;
  }
}

/* Helpers */
function clamp01(n) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
