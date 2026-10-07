/**
 * ActivityEngine — batch-level helpers built on top of ProfileEngine.
 *
 * Where ProfileEngine answers "what is this one profile's activity state?",
 * ActivityEngine answers "how many are online?", "who is online?",
 * "what does the pulse look like right now?"
 *
 * Pure. No I/O.
 */

import { ACTIVITY_STATE } from '../core/constants.js';

export class ActivityEngine {
  constructor({ profileEngine }) {
    if (!profileEngine) throw new Error('ActivityEngine requires a ProfileEngine');
    this.profileEngine = profileEngine;
  }

  /**
   * Partition a list of profiles by their current activity state.
   * Returns an object: { online: [], recently_active: [], active_today: [], inactive: [] }
   */
  partition(profiles = []) {
    const out = {
      [ACTIVITY_STATE.ONLINE]: [],
      [ACTIVITY_STATE.RECENTLY_ACTIVE]: [],
      [ACTIVITY_STATE.ACTIVE_TODAY]: [],
      [ACTIVITY_STATE.INACTIVE]: [],
    };
    for (const p of profiles) {
      const state = this.profileEngine.activityState(p);
      out[state].push(p);
    }
    return out;
  }

  /**
   * Returns ids of profiles currently online.
   */
  onlineIds(profiles = []) {
    return profiles
      .filter((p) => this.profileEngine.isOnline(p))
      .map((p) => p.id);
  }

  /**
   * Count of profiles currently online.
   */
  onlineCount(profiles = []) {
    return this.onlineIds(profiles).length;
  }

  /**
   * Sorted list of profiles by recency, most recent first.
   */
  sortByRecency(profiles = []) {
    return [...profiles]
      .map((p) => ({ p, r: this.profileEngine.recencyScore(p) }))
      .sort((a, b) => {
        if (b.r !== a.r) return b.r - a.r;
        return String(a.p.id).localeCompare(String(b.p.id));
      })
      .map((x) => x.p);
  }

  /**
   * Aggregate pulse for the home screen.
   * Counts how many are online, recently active, and active today.
   */
  pulse(profiles = []) {
    const parts = this.partition(profiles);
    return {
      online: parts[ACTIVITY_STATE.ONLINE].length,
      recentlyActive: parts[ACTIVITY_STATE.RECENTLY_ACTIVE].length,
      activeToday: parts[ACTIVITY_STATE.ACTIVE_TODAY].length,
      inactive: parts[ACTIVITY_STATE.INACTIVE].length,
      total: profiles.length,
    };
  }
}
