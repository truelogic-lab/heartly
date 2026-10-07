/**
 * PromptRepository — interface contract.
 *
 * @typedef {object} PromptRecord
 * @property {string} id
 * @property {string} promptId       // e.g. 'sunrise'
 * @property {string} userId
 * @property {string} answer
 * @property {number} createdAt
 */
export class PromptRepository {
  async listByUserId(_userId) { throw new Error('not implemented'); }
  async upsert(_data) { throw new Error('not implemented'); }
  async delete(_userId, _promptId) { throw new Error('not implemented'); }
  async countForUser(_userId) { throw new Error('not implemented'); }
}
