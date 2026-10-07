/**
 * PhotoRepository — interface contract.
 *
 * @typedef {object} PhotoRecord
 * @property {string} id
 * @property {string} userId
 * @property {string} url
 * @property {number} order
 * @property {boolean} [isPrimary]
 * @property {number} createdAt
 */
export class PhotoRepository {
  async listByUserId(_userId) { throw new Error('not implemented'); }
  async add(_data) { throw new Error('not implemented'); }
  async delete(_id) { throw new Error('not implemented'); }
  async deleteAllForUser(_userId) { throw new Error('not implemented'); }
  async countForUser(_userId) { throw new Error('not implemented'); }
}
