/**
 * UserRepository — interface contract.
 *
 * Implements the storage layer for user accounts.
 * Business logic does not live here.
 *
 * @typedef {object} UserRecord
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} [passwordHash]
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {boolean} [deactivated]
 */
export class UserRepository {
  async findById(_id) { throw new Error('not implemented'); }
  async findByEmail(_email) { throw new Error('not implemented'); }
  async create(_data) { throw new Error('not implemented'); }
  async update(_id, _patch) { throw new Error('not implemented'); }
  async delete(_id) { throw new Error('not implemented'); }
  async listByIds(_ids) { throw new Error('not implemented'); }
  async count() { throw new Error('not implemented'); }
}
