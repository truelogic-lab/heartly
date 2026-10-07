/**
 * MatchRepository — interface contract.
 *
 * @typedef {object} MatchRecord
 * @property {string} id               // deterministic pairId
 * @property {string[]} users          // sorted, length 2
 * @property {number} createdAt
 * @property {number} lastMessageAt    // 0 if none
 * @property {string} [lastMessagePreview]
 * @property {boolean} [blocked]
 * @property {boolean} [deleted]
 */
export class MatchRepository {
  async findById(_id) { throw new Error('not implemented'); }
  async findBetween(_userA, _userB) { throw new Error('not implemented'); }
  async create(_data) { throw new Error('not implemented'); }
  async listForUser(_userId) { throw new Error('not implemented'); }
  async update(_id, _patch) { throw new Error('not implemented'); }
  async softDelete(_id) { throw new Error('not implemented'); }
  async countForUser(_userId) { throw new Error('not implemented'); }
}
