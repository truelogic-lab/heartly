import { RecommendationEngine } from '../domain/RecommendationEngine.js';
import { ValidationError } from '../core/errors.js';

export class RecommendationService {
  constructor({
    profileService,
    profileRepository,
    likeRepository,
    matchRepository,
    blockRepository,
    discoveryEngine,
    profileEngine,
    clock,
  }) {
    this.profileService = profileService;
    this.profiles = profileRepository;
    this.likes = likeRepository;
    this.matches = matchRepository;
    this.blocks = blockRepository;
    this.clock = clock;
    this.engine = new RecommendationEngine({
      discoveryEngine,
      profileEngine,
    });
  }

  async dailyPicks(viewerId, dayStamp, count) {
    const viewer = await this.profileService.getEnriched(viewerId);
    const candidates = await this._candidatesFor(viewerId);
    const state = await this._stateFor(viewerId);
    const picks = this.engine.dailyPicks(viewer, candidates, state, dayStamp, count);
    return this._enrich(picks);
  }

  async onlineNow(viewerId, count = 6) {
    const viewer = await this.profileService.getEnriched(viewerId);
    const candidates = await this._candidatesFor(viewerId);
    const state = await this._stateFor(viewerId);
    const list = this.engine.onlineNow(viewer, candidates, state, count);
    return this._enrich(list);
  }

  async bySharedInterests(viewerId, count = 6) {
    const viewer = await this.profileService.getEnriched(viewerId);
    const candidates = await this._candidatesFor(viewerId);
    const state = await this._stateFor(viewerId);
    const list = this.engine.bySharedInterests(viewer, candidates, state, count);
    return this._enrich(list);
  }

  async _candidatesFor(viewerId) {
    const all = await this.profiles.listAll();
    return all.filter((p) => p.userId !== viewerId && !p.deactivated);
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
    const matchedIds = new Set(matches.map((m) => m.users.find((u) => u !== viewerId)));
    const blockedIds = new Set();
    for (const b of blockList) {
      blockedIds.add(b.blockerId === viewerId ? b.blockedId : b.blockerId);
    }
    return { likedIds, passedIds, matchedIds, blockedIds };
  }

  async _enrich(rankedList) {
    const out = [];
    for (const r of rankedList) {
      const enriched = await this.profileService.getEnriched(r.candidate.userId);
      out.push({
        profile: enriched,
        compatibility: r.compatibility,
        rankingScore: r.rankingScore,
        breakdown: r.breakdown,
      });
    }
    return out;
  }
}
