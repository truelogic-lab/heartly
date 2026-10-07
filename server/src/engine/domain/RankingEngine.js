/**
 * RankingEngine — produces a single ranking score for a candidate.
 *
 * Given a viewer profile and a candidate profile plus a compatibility
 * score, returns { score, breakdown } where score is 0–1.
 *
 * The Discovery engine sorts by this score.
 */

import { RANKING_WEIGHTS } from '../core/constants.js';
import { distanceKm, closenessScore } from '../core/geo.js';
import { DISTANCE } from '../core/constants.js';

export class RankingEngine {
  constructor({ profileEngine }) {
    if (!profileEngine) throw new Error('RankingEngine requires a ProfileEngine');
    this.profileEngine = profileEngine;
  }

  /**
   * @param {object} viewer - the user seeing the feed
   * @param {object} candidate - the profile being ranked
   * @param {number} compatibility - 0–100 from CompatibilityEngine
   * @returns {{ score: number, breakdown: object }}
   */
  rank(viewer, candidate, compatibility = 0) {
    if (!viewer || !candidate) return { score: 0, breakdown: emptyBreakdown() };

    const parts = {
      distance:         this._distanceScore(viewer, candidate),
      compatibility:    clamp01(compatibility / 100),
      sharedInterests:  this._sharedInterestsScore(viewer, candidate),
      profileQuality:   this.profileEngine.quality(candidate),
      activity:         this.profileEngine.recencyScore(candidate),
      verification:     candidate.verified ? 1 : 0,
    };

    const score =
      parts.distance        * RANKING_WEIGHTS.DISTANCE +
      parts.compatibility   * RANKING_WEIGHTS.COMPATIBILITY +
      parts.sharedInterests * RANKING_WEIGHTS.SHARED_INTERESTS +
      parts.profileQuality  * RANKING_WEIGHTS.PROFILE_QUALITY +
      parts.activity        * RANKING_WEIGHTS.ACTIVITY +
      parts.verification    * RANKING_WEIGHTS.VERIFICATION;

    return { score: clamp01(score), breakdown: parts };
  }

  /**
   * Sort a list of { candidate, compatibility } by ranking score.
   * Deterministic tie-break on candidate.id for stable ordering.
   */
  sort(viewer, items) {
    const ranked = items.map((it) => {
      const { score, breakdown } = this.rank(viewer, it.candidate, it.compatibility ?? 0);
      return { ...it, rankingScore: score, rankingBreakdown: breakdown };
    });

    ranked.sort((x, y) => {
      if (y.rankingScore !== x.rankingScore) {
        return y.rankingScore - x.rankingScore;
      }
      return String(x.candidate.id).localeCompare(String(y.candidate.id));
    });

    return ranked;
  }

  /* ---------- Factors ---------- */

  _distanceScore(viewer, candidate) {
    if (!viewer.location || !candidate.location) return 0;
    const d = distanceKm(viewer.location, candidate.location);
    const max = viewer.preferences?.maxDistanceKm ?? DISTANCE.DEFAULT_KM;
    return closenessScore(d, max);
  }

  _sharedInterestsScore(a, b) {
    const setA = new Set((a.interests || []).map((s) => s.toLowerCase()));
    const setB = new Set((b.interests || []).map((s) => s.toLowerCase()));
    if (setA.size === 0 || setB.size === 0) return 0;
    let shared = 0;
    for (const i of setA) if (setB.has(i)) shared++;
    return shared / Math.min(setA.size, setB.size);
  }
}

function clamp01(n) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function emptyBreakdown() {
  return {
    distance: 0,
    compatibility: 0,
    sharedInterests: 0,
    profileQuality: 0,
    activity: 0,
    verification: 0,
  };
}
