/**
 * BlockRepository — interface contract.
 *
 * @typedef {object} BlockRecord
 * @property {string} id
 * @property {string} blockerId
 * @property {string} blockedId
 * @property {number} createdAt
 */
export class BlockRepository {
  async add(_data) { throw new Error('not implemented'); }
  async find(_blockerId, _blockedId) { throw new Error('not implemented'); }
  async isBlockedEitherDirection(_userA, _userB) { throw new Error('not implemented'); }
  async listByBlocker(_blockerId) { throw new Error('not implemented'); }
  async listInvolvingUser(_userId) { throw new Error('not implemented'); }
  async remove(_blockerId, _blockedId) { throw new Error('not implemented'); }
}
