/**
 * DiscoveryEngine — decides who appears in a user's discovery feed.
 *
 * Two-stage:
 *   1. HARD FILTERS   (exclude candidates who must not appear)
 *   2. SOFT RANKING   (sort remaining candidates by ranking score)
 *
 * Pure. No I/O. Receives raw data as arguments.
 */

import { DISTANCE, LOOKING_FOR, GENDERS } from '../core/constants.js';
import { distanceKm } from '../core/geo.js';

export class DiscoveryEngine {
  constructor({ rankingEngine, compatibilityEngine }) {
    if (!rankingEngine) throw new Error('DiscoveryEngine requires a RankingEngine');
    if (!compatibilityEngine) throw new Error('DiscoveryEngine requires a CompatibilityEngine');
    this.rankingEngine = rankingEngine;
    this.compatibilityEngine = compatibilityEngine;
  }

  /**
   * @param {object} viewer - the user seeing the feed
   * @param {object[]} candidates - raw list of candidate profiles
   * @param {object} state - interaction state
   * @param {Set<string>} state.likedIds    - ids the viewer has liked
   * @param {Set<string>} state.passedIds   - ids the viewer has passed
   * @param {Set<string>} state.matchedIds  - ids already matched
   * @param {Set<string>} state.blockedIds  - ids blocked in either direction
   * @returns {Array<{ candidate: object, compatibility: number, rankingScore: number, breakdown: object }>}
   */
  discover(viewer, candidates, state = {}) {
    if (!viewer || !Array.isArray(candidates)) return [];

    const likedIds   = state.likedIds   ?? new Set();
    const passedIds  = state.passedIds  ?? new Set();
    const matchedIds = state.matchedIds ?? new Set();
    const blockedIds = state.blockedIds ?? new Set();

    /* ---------- STAGE 1 — hard filters ---------- */
    const filtered = candidates.filter((c) => {
      if (!c) return false;
      // Support both { id } and { userId } shapes — the identity of a
      // candidate in the feed is its user id, not its profile id.
      const uid = c.userId ?? c.id;
      if (!uid) return false;
      const viewerUid = viewer.userId ?? viewer.id;
      if (uid === viewerUid) return false;                  // never show self
      if (c.deactivated === true) return false;             // hidden accounts
      if (blockedIds.has(uid)) return false;                // blocked either direction
      if (likedIds.has(uid)) return false;                  // already liked
      if (passedIds.has(uid)) return false;                 // already passed
      if (matchedIds.has(uid)) return false;                // already matched
      if (!this._passesGenderFilter(viewer, c)) return false;
      if (!this._passesAgeFilter(viewer, c)) return false;
      if (!this._passesDistanceFilter(viewer, c)) return false;
      return true;
    });

    /* ---------- STAGE 2 — soft ranking ---------- */
    const scored = filtered.map((candidate) => {
      const compatibility = this.compatibilityEngine.score(viewer, candidate);
      return { candidate, compatibility };
    });

    return this.rankingEngine.sort(viewer, scored).map((r) => ({
      candidate: r.candidate,
      compatibility: r.compatibility,
      rankingScore: r.rankingScore,
      breakdown: r.rankingBreakdown,
    }));
  }

  /* ---------- Individual filters ---------- */

  _passesGenderFilter(viewer, candidate) {
    const lookingFor = viewer.preferences?.lookingFor ?? LOOKING_FOR.EVERYONE;
    if (lookingFor === LOOKING_FOR.EVERYONE) return true;
    if (lookingFor === LOOKING_FOR.WOMEN) return candidate.gender === GENDERS.WOMAN;
    if (lookingFor === LOOKING_FOR.MEN)   return candidate.gender === GENDERS.MAN;
    return true;
  }

  _passesAgeFilter(viewer, candidate) {
    const age = ageOf(candidate.birthdate, Date.now());
    if (age == null) return true; // no birthdate → don't exclude
    const min = viewer.preferences?.minAge ?? 18;
    const max = viewer.preferences?.maxAge ?? 100;
    return age >= min && age <= max;
  }

  _passesDistanceFilter(viewer, candidate) {
    if (!viewer.location || !candidate.location) return true;
    const max = viewer.preferences?.maxDistanceKm ?? DISTANCE.DEFAULT_KM;
    return distanceKm(viewer.location, candidate.location) <= max;
  }
}

function ageOf(birthdateMs, nowMs) {
  if (!birthdateMs) return null;
  const d = new Date(birthdateMs);
  const n = new Date(nowMs);
  let age = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) age--;
  return age;
}
