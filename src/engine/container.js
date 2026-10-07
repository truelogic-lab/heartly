/**
 * Container — wires the entire engine together.
 *
 * Usage:
 *   const engine = createEngine();          // memory
 *   const engine = createEngine({ repositories: { ... } });
 *
 * To connect a real database later:
 *   - implement the repository interfaces (Prisma)
 *   - pass them in via the `repositories` option
 *   - nothing else changes
 */

import { SystemClock } from './core/clock.js';
import { EventBus } from './events/EventBus.js';

import { ProfileEngine } from './domain/ProfileEngine.js';
import { CompatibilityEngine } from './domain/CompatibilityEngine.js';
import { RankingEngine } from './domain/RankingEngine.js';
import { DiscoveryEngine } from './domain/DiscoveryEngine.js';
import { RecommendationEngine } from './domain/RecommendationEngine.js';
import { ActivityEngine } from './domain/ActivityEngine.js';

import { ProfileService } from './services/ProfileService.js';
import { DiscoveryService } from './services/DiscoveryService.js';
import { LikeService } from './services/LikeService.js';
import { MatchService } from './services/MatchService.js';
import { MessageService } from './services/MessageService.js';
import { RecommendationService } from './services/RecommendationService.js';
import { SafetyService } from './services/SafetyService.js';

import { MemoryUserRepository } from './repositories/memory/MemoryUserRepository.js';
import { MemoryProfileRepository } from './repositories/memory/MemoryProfileRepository.js';
import { MemoryPhotoRepository } from './repositories/memory/MemoryPhotoRepository.js';
import { MemoryLikeRepository } from './repositories/memory/MemoryLikeRepository.js';
import { MemoryMatchRepository } from './repositories/memory/MemoryMatchRepository.js';
import { MemoryMessageRepository } from './repositories/memory/MemoryMessageRepository.js';
import { MemoryBlockRepository } from './repositories/memory/MemoryBlockRepository.js';
import { MemoryPromptRepository } from './repositories/memory/MemoryPromptRepository.js';

export function createEngine({ clock, repositories, eventBus } = {}) {
  const resolvedClock = clock ?? new SystemClock();
  const resolvedEventBus = eventBus ?? new EventBus();

  const repos = {
    users:    repositories?.users    ?? new MemoryUserRepository({ clock: resolvedClock }),
    profiles: repositories?.profiles ?? new MemoryProfileRepository({ clock: resolvedClock }),
    photos:   repositories?.photos   ?? new MemoryPhotoRepository({ clock: resolvedClock }),
    likes:    repositories?.likes    ?? new MemoryLikeRepository({ clock: resolvedClock }),
    matches:  repositories?.matches  ?? new MemoryMatchRepository({ clock: resolvedClock }),
    messages: repositories?.messages ?? new MemoryMessageRepository({ clock: resolvedClock }),
    blocks:   repositories?.blocks   ?? new MemoryBlockRepository({ clock: resolvedClock }),
    prompts:  repositories?.prompts  ?? new MemoryPromptRepository({ clock: resolvedClock }),
  };

  // Domain engines
  const profileEngine = new ProfileEngine({ clock: resolvedClock });
  const compatibilityEngine = new CompatibilityEngine();
  const rankingEngine = new RankingEngine({ profileEngine });
  const discoveryEngine = new DiscoveryEngine({ rankingEngine, compatibilityEngine });
  const activityEngine = new ActivityEngine({ profileEngine });

  // Services
  const profileService = new ProfileService({
    profileRepository: repos.profiles,
    photoRepository: repos.photos,
    promptRepository: repos.prompts,
    clock: resolvedClock,
  });

  const discoveryService = new DiscoveryService({
    discoveryEngine,
    profileService,
    profileRepository: repos.profiles,
    likeRepository: repos.likes,
    matchRepository: repos.matches,
    blockRepository: repos.blocks,
  });

  const likeService = new LikeService({
    userRepository: repos.users,
    profileRepository: repos.profiles,
    likeRepository: repos.likes,
    matchRepository: repos.matches,
    blockRepository: repos.blocks,
    eventBus: resolvedEventBus,
    clock: resolvedClock,
  });

  const matchService = new MatchService({
    matchRepository: repos.matches,
    profileRepository: repos.profiles,
    messageRepository: repos.messages,
    clock: resolvedClock,
  });

  const messageService = new MessageService({
    messageRepository: repos.messages,
    matchRepository: repos.matches,
    blockRepository: repos.blocks,
    profileRepository: repos.profiles,
    eventBus: resolvedEventBus,
    clock: resolvedClock,
  });

  const recommendationService = new RecommendationService({
    profileService,
    profileRepository: repos.profiles,
    likeRepository: repos.likes,
    matchRepository: repos.matches,
    blockRepository: repos.blocks,
    discoveryEngine,
    profileEngine,
    clock: resolvedClock,
  });

  const safetyService = new SafetyService({
    blockRepository: repos.blocks,
    matchRepository: repos.matches,
    eventBus: resolvedEventBus,
    clock: resolvedClock,
  });

  return {
    clock: resolvedClock,
    events: resolvedEventBus,
    repositories: repos,
    engines: {
      profile: profileEngine,
      compatibility: compatibilityEngine,
      ranking: rankingEngine,
      discovery: discoveryEngine,
      activity: activityEngine,
    },
    services: {
      profile: profileService,
      discovery: discoveryService,
      like: likeService,
      match: matchService,
      message: messageService,
      recommendation: recommendationService,
      safety: safetyService,
    },
  };
}
