/**
 * CompatibilityEngine — Heartly's recommendation score (0–100).
 *
 * NOTE: This is NOT a scientific measure of compatibility.
 * It is Heartly's own recommendation score based on profile signals.
 *
 * Every factor is weighted independently (see COMPATIBILITY_WEIGHTS).
 * The formula can be tuned without touching any other engine.
 */

import { COMPATIBILITY_WEIGHTS, DISTANCE } from '../core/constants.js';
import { distanceKm, closenessScore } from '../core/geo.js';

export class CompatibilityEngine {
  /**
   * Compute a compatibility score between two profiles.
   *
   * @param {object} a - viewer profile
   * @param {object} b - candidate profile
   * @returns {number} 0–100
   */
  score(a, b) {
    if (!a || !b) return 0;

    const parts = {
      sharedInterests: this._sharedInterestsScore(a, b),
      agePreference:   this._agePreferenceScore(a, b),
      intention:       this._intentionScore(a, b),
      distance:        this._distanceScore(a, b),
      completeness:    this._completenessScore(b),
      promptSimilarity: this._promptSimilarityScore(a, b),
    };

    const total =
      parts.sharedInterests   * COMPATIBILITY_WEIGHTS.SHARED_INTERESTS +
      parts.agePreference     * COMPATIBILITY_WEIGHTS.AGE_PREFERENCE +
      parts.intention         * COMPATIBILITY_WEIGHTS.INTENTION +
      parts.distance          * COMPATIBILITY_WEIGHTS.DISTANCE +
      parts.completeness      * COMPATIBILITY_WEIGHTS.PROFILE_COMPLETENESS +
      parts.promptSimilarity  * COMPATIBILITY_WEIGHTS.PROMPT_SIMILARITY;

    return Math.round(clamp(total, 0, 100));
  }

  /**
   * Detailed breakdown — useful for debugging and for showing
   * "why we matched you" reasons to users later.
   */
  breakdown(a, b) {
    return {
      sharedInterests: this._sharedInterestsScore(a, b),
      agePreference:   this._agePreferenceScore(a, b),
      intention:       this._intentionScore(a, b),
      distance:        this._distanceScore(a, b),
      completeness:    this._completenessScore(b),
      promptSimilarity: this._promptSimilarityScore(a, b),
    };
  }

  /* ---------- Individual factors (all return 0–1) ---------- */

  _sharedInterestsScore(a, b) {
    const setA = new Set((a.interests || []).map((s) => s.toLowerCase()));
    const setB = new Set((b.interests || []).map((s) => s.toLowerCase()));
    if (setA.size === 0 || setB.size === 0) return 0;

    let shared = 0;
    for (const i of setA) if (setB.has(i)) shared++;

    // Normalize by the smaller set so 3/3 beats 3/10
    const denom = Math.min(setA.size, setB.size);
    return denom === 0 ? 0 : shared / denom;
  }

  _agePreferenceScore(a, b) {
    const age = ageOf(b.birthdate, Date.now());
    if (age == null) return 0;
    const prefs = a.preferences || {};
    const min = prefs.minAge ?? 18;
    const max = prefs.maxAge ?? 100;
    if (age < min || age > max) return 0;

    // Closer to the middle of the range scores higher
    const mid = (min + max) / 2;
    const span = Math.max(1, (max - min) / 2);
    const distFromMid = Math.abs(age - mid);
    return clamp01(1 - distFromMid / span);
  }

  _intentionScore(a, b) {
    if (!a.intention || !b.intention) return 0;
    return a.intention === b.intention ? 1 : 0;
  }

  _distanceScore(a, b) {
    if (!a.location || !b.location) return 0;
    const d = distanceKm(a.location, b.location);
    const max = a.preferences?.maxDistanceKm ?? DISTANCE.DEFAULT_KM;
    return closenessScore(d, max);
  }

  _completenessScore(b) {
    // Rough completeness — matches ProfileEngine but kept local
    // to avoid a circular dependency. The ProfileEngine is still the
    // source of truth when called through the service layer.
    let s = 0;
    if (b.name) s += 10;
    if (b.bio) s += 15;
    if (b.birthdate) s += 10;
    if (b.gender) s += 5;
    if (b.location) s += 10;
    if ((b.photos?.length ?? 0) >= 1) s += 15;
    if ((b.photos?.length ?? 0) >= 6) s += 15;
    if ((b.interests?.length ?? 0) >= 3) s += 10;
    if ((b.prompts?.length ?? 0) >= 3) s += 5;
    if (b.verified) s += 5;
    return clamp01(s / 100);
  }

  _promptSimilarityScore(a, b) {
    const pa = Array.isArray(a.prompts) ? a.prompts : [];
    const pb = Array.isArray(b.prompts) ? b.prompts : [];
    if (pa.length === 0 || pb.length === 0) return 0;

    // Prompt similarity = matching on the same prompt ID AND the same answer
    const mapB = new Map(pb.map((p) => [p.promptId, normalize(p.answer)]));
    let matched = 0;
    let considered = 0;
    for (const p of pa) {
      if (mapB.has(p.promptId)) {
        considered++;
        if (mapB.get(p.promptId) === normalize(p.answer)) matched++;
      }
    }
    return considered === 0 ? 0 : matched / considered;
  }
}

/* ---------- Helpers ---------- */

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function clamp01(n) {
  return clamp(n, 0, 1);
}

function normalize(s) {
  return typeof s === 'string' ? s.trim().toLowerCase() : '';
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
