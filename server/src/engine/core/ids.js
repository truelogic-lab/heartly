/**
 * Heartly Dating Engine — id generation.
 *
 * Simple, dependency-free, collision-resistant enough for our scale.
 * Format: prefix_<timestamp>_<random>
 * Example: usr_1704067200000_a1b2c3d4
 */

let counter = 0;

function randomPart() {
  counter = (counter + 1) % 1_000_000;
  return Math.random().toString(36).slice(2, 8) + counter.toString(36);
}

export function newId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${randomPart()}`;
}

export const newUserId    = () => newId('usr');
export const newProfileId = () => newId('prf');
export const newPhotoId   = () => newId('pho');
export const newLikeId    = () => newId('lik');
export const newMatchId   = () => newId('mat');
export const newMessageId = () => newId('msg');
export const newBlockId   = () => newId('blk');
export const newPromptId  = () => newId('pmt');
