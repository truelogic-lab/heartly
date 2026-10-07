export { PrismaUserRepository } from './PrismaUserRepository.js';
export { PrismaProfileRepository } from './PrismaProfileRepository.js';
export { PrismaPhotoRepository } from './PrismaPhotoRepository.js';
export { PrismaLikeRepository } from './PrismaLikeRepository.js';
export { PrismaMatchRepository } from './PrismaMatchRepository.js';
export { PrismaMessageRepository } from './PrismaMessageRepository.js';
export { PrismaBlockRepository } from './PrismaBlockRepository.js';
export { PrismaPromptRepository } from './PrismaPromptRepository.js';

import { PrismaUserRepository } from './PrismaUserRepository.js';
import { PrismaProfileRepository } from './PrismaProfileRepository.js';
import { PrismaPhotoRepository } from './PrismaPhotoRepository.js';
import { PrismaLikeRepository } from './PrismaLikeRepository.js';
import { PrismaMatchRepository } from './PrismaMatchRepository.js';
import { PrismaMessageRepository } from './PrismaMessageRepository.js';
import { PrismaBlockRepository } from './PrismaBlockRepository.js';
import { PrismaPromptRepository } from './PrismaPromptRepository.js';

/** Factory — returns all 8 repositories ready to hand to the engine. */
export function buildPrismaRepositories() {
  return {
    users: new PrismaUserRepository(),
    profiles: new PrismaProfileRepository(),
    photos: new PrismaPhotoRepository(),
    likes: new PrismaLikeRepository(),
    matches: new PrismaMatchRepository(),
    messages: new PrismaMessageRepository(),
    blocks: new PrismaBlockRepository(),
    prompts: new PrismaPromptRepository(),
  };
}
