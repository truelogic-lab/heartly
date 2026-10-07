/**
 * MessageRepository — interface contract.
 *
 * @typedef {object} MessageRecord
 * @property {string} id
 * @property {string} matchId
 * @property {string} senderId
 * @property {string} body
 * @property {number} createdAt
 * @property {boolean} [read]
 * @property {number} [readAt]
 */
export class MessageRepository {
  async add(_data) { throw new Error('not implemented'); }
  async listByMatch(_matchId, _options) { throw new Error('not implemented'); }
  async countByMatch(_matchId) { throw new Error('not implemented'); }
  async markRead(_matchId, _readerId, _at) { throw new Error('not implemented'); }
  async delete(_id) { throw new Error('not implemented'); }
  async latestForMatch(_matchId) { throw new Error('not implemented'); }
}
