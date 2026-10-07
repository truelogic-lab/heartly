/**
 * DiscoveryService — produces the enriched discovery feed.
 *
 * Responsibilities:
 *   - Load the viewer's enriched profile
 *   - Load candidate profiles (excluding obvious exclusions early)
 *   - Build the interaction state (liked / passed / matched / blocked)
 *   - Hand off to DiscoveryEngine
 *   - Return enriched results the UI can render directly
 */

import { NotFoundError } from '../core/errors.js';

export class DiscoveryService {
  constructor({
    discoveryEngine,
    profileService,
    profileRepository,
    likeRepository,
    matchRepository,
    blockRepository,
  }) {
    this.discovery = discoveryEngine;
    this.profileService = profileService;
    this.profiles = profileRepository;
    this.likes = likeRepository;
    this.matches = matchRepository;
    this.blocks = blockRepository;
  }

  /**
   * @param {string} viewerId
   * @param {{ limit?: number, excludeIds?: string[] }} options
   * @returns {Promise<Array<{profile, compatibility, rankingScore, breakdown}>>}
   */
  async feedFor(viewerId, { limit = 40, excludeIds = [] } = {}) {
    const viewer = await this.profileService.getEnriched(viewerId);
    if (!viewer) throw new NotFoundError('viewer profile');

    const allProfiles = await this.profiles.listAll();
    const viewerExclusions = new Set([viewerId, ...excludeIds]);
    const candidates = allProfiles.filter(
      (p) => !viewerExclusions.has(p.userId) && !p.deactivated
    );

    const state = await this._stateFor(viewerId);
    const ranked = this.discovery.discover(viewer, candidates, state);

    // Enrich each result
    const enriched = [];
    for (const r of ranked.slice(0, limit)) {
      const enrichedProfile = await this.profileService.getEnriched(r.candidate.userId);
      enriched.push({
        profile: enrichedProfile,
        compatibility: r.compatibility,
        rankingScore: r.rankingScore,
        breakdown: r.breakdown,
      });
    }
    return enriched;
  }

  async _stateFor(viewerId) {
    const [liked, passes, matches, blockList] = await Promise.all([
      this.likes.listOutbound(viewerId),
      this.likes.listPasses(viewerId),
      this.matches.listForUser(viewerId),
      this.blocks.listInvolvingUser(viewerId),
    ]);

    const likedIds = new Set(liked.map((l) => l.toUserId));
    const passedIds = new Set(passes.map((p) => p.toUserId));
    const matchedIds = new Set();
    for (const m of matches) {
      const other = m.users.find((u) => u !== viewerId);
      if (other) matchedIds.add(other);
    }
    const blockedIds = new Set();
    for (const b of blockList) {
      const other = b.blockerId === viewerId ? b.blockedId : b.blockerId;
      blockedIds.add(other);
    }
    return { likedIds, passedIds, matchedIds, blockedIds };
  }
}
