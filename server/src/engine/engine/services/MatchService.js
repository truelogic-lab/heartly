import { NotFoundError, ValidationError } from '../core/errors.js';
import { MatchEngine } from '../domain/MatchEngine.js';

export class MatchService {
  constructor({ matchRepository, profileRepository, messageRepository, clock }) {
    this.matches = matchRepository;
    this.profiles = profileRepository;
    this.messages = messageRepository;
    this.matchEngine = new MatchEngine({ clock });
  }

  /**
   * List all matches for a user, enriched with the other user's profile
   * and a chat preview.
   */
  async listForUser(userId) {
    if (!userId) throw new ValidationError('userId is required');
    const rows = await this.matches.listForUser(userId);
    const out = [];
    for (const m of rows) {
      const otherId = this.matchEngine.otherUser(m, userId);
      if (!otherId) continue;
      const profile = await this.profiles.findByUserId(otherId);
      if (!profile) continue;
      const latest = await this.messages.latestForMatch(m.id);
      out.push({
        match: m,
        otherProfile: profile,
        lastMessage: latest,
      });
    }
    return out;
  }

  async getById(matchId) {
    const m = await this.matches.findById(matchId);
    if (!m) throw new NotFoundError('match');
    return m;
  }

  /**
   * For a given match id, return { match, otherProfile } from viewer's perspective.
   */
  async detail(matchId, viewerId) {
    if (!matchId || !viewerId) throw new ValidationError('matchId and viewerId required');
    const m = await this.getById(matchId);
    if (!this.matchEngine.includes(m, viewerId)) {
      throw new NotFoundError('match');
    }
    const otherId = this.matchEngine.otherUser(m, viewerId);
    const profile = otherId ? await this.profiles.findByUserId(otherId) : null;
    return { match: m, otherProfile: profile };
  }
}
