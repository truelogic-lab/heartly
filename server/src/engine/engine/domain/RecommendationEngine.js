/**
 * RecommendationEngine — wraps the DiscoveryEngine to produce the
 * specific recommendation surfaces the product shows:
 *
 *   - Discover      (full ranked feed)
 *   - Daily Picks   (small high-quality selection, deterministic per day)
 *   - Online Now    (candidates who are currently online, sorted by recency)
 *
 * Deterministic: given the same viewer, candidates, state, and day stamp,
 * the output is always the same.
 */

import { DAILY_PICKS } from '../core/constants.js';

export class RecommendationEngine {
  constructor({ discoveryEngine, profileEngine }) {
    if (!discoveryEngine) throw new Error('RecommendationEngine requires a DiscoveryEngine');
    if (!profileEngine) throw new Error('RecommendationEngine requires a ProfileEngine');
    this.discoveryEngine = discoveryEngine;
    this.profileEngine = profileEngine;
  }

  /**
   * Full ranked discovery feed.
   */
  discover(viewer, candidates, state = {}) {
    return this.discoveryEngine.discover(viewer, candidates, state);
  }

  /**
   * A small curated selection of high-compatibility candidates.
   * Deterministic per day via a dayStamp derived from the clock.
   *
   * @param {object} viewer
   * @param {object[]} candidates
   * @param {object} state
   * @param {string} dayStamp - e.g. "2026-10-07"
   * @param {number} count - default DAILY_PICKS.COUNT
   */
  dailyPicks(viewer, candidates, state = {}, dayStamp = '1970-01-01', count = DAILY_PICKS.COUNT) {
    const ranked = this.discoveryEngine.discover(viewer, candidates, state);
    if (ranked.length === 0) return [];

    // Only pick high-compatibility candidates
    const eligible = ranked.filter(
      (r) => r.compatibility >= DAILY_PICKS.MIN_COMPATIBILITY
    );
    const pool = eligible.length >= count ? eligible : ranked;

    // Deterministic shuffle keyed on dayStamp + viewer.id
    const seed = hash(`${viewer.id}:${dayStamp}`);
    const shuffled = deterministicShuffle(pool, seed);

    // Preserve ranking order but with a per-day variation.
    // Approach: score each entry with (rankingScore, deterministic index),
    // then take the top N.
    const picked = shuffled
      .map((entry, i) => ({
        entry,
        key: entry.rankingScore * 1.0 - i * 1e-9,
      }))
      .sort((a, b) => b.key - a.key)
      .slice(0, count)
      .map((x) => x.entry);

    return picked;
  }

  /**
   * Candidates who are currently online, sorted by recency.
   * Falls back to recently-active if nobody is truly online.
   */
  onlineNow(viewer, candidates, state = {}, count = 6) {
    const ranked = this.discoveryEngine.discover(viewer, candidates, state);
    if (ranked.length === 0) return [];

    const online = ranked.filter(
      (r) => this.profileEngine.isOnline(r.candidate)
    );
    const pool = online.length >= 2 ? online : ranked;

    // Sort by recency score, tie-break on rankingScore, then id (determinism)
    const sorted = [...pool].sort((a, b) => {
      const ra = this.profileEngine.recencyScore(a.candidate);
      const rb = this.profileEngine.recencyScore(b.candidate);
      if (rb !== ra) return rb - ra;
      if (b.rankingScore !== a.rankingScore) return b.rankingScore - a.rankingScore;
      return String(a.candidate.id).localeCompare(String(b.candidate.id));
    });

    return sorted.slice(0, count);
  }

  /**
   * Candidates sharing the most interests with the viewer.
   */
  bySharedInterests(viewer, candidates, state = {}, count = 6) {
    const ranked = this.discoveryEngine.discover(viewer, candidates, state);
    const viewerSet = new Set((viewer.interests ?? []).map((s) => s.toLowerCase()));
    if (viewerSet.size === 0) return [];

    const withShared = ranked.map((r) => {
      const cSet = new Set((r.candidate.interests ?? []).map((s) => s.toLowerCase()));
      let shared = 0;
      for (const i of viewerSet) if (cSet.has(i)) shared++;
      return { ...r, _shared: shared };
    });

    withShared.sort((a, b) => {
      if (b._shared !== a._shared) return b._shared - a._shared;
      if (b.rankingScore !== a.rankingScore) return b.rankingScore - a.rankingScore;
      return String(a.candidate.id).localeCompare(String(b.candidate.id));
    });

    return withShared.slice(0, count).map(({ _shared, ...rest }) => rest);
  }
}

/* ---------- Deterministic helpers ---------- */

function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deterministicShuffle(arr, seed) {
  const rand = mulberry32(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
