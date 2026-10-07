/**
 * ProfileRepository — interface contract.
 *
 * @typedef {object} ProfileRecord
 * @property {string} id
 * @property {string} userId
 * @property {string} name
 * @property {string} [bio]
 * @property {number} [birthdate]     // ms
 * @property {string} [gender]
 * @property {string} [lookingFor]
 * @property {string} [intention]
 * @property {{lat:number,lng:number}} [location]
 * @property {string[]} [interests]
 * @property {object} [preferences]
 * @property {boolean} [verified]
 * @property {boolean} [deactivated]
 * @property {number} [lastActiveAt]
 * @property {number} createdAt
 * @property {number} updatedAt
 */
export class ProfileRepository {
  async findByUserId(_userId) { throw new Error('not implemented'); }
  async create(_data) { throw new Error('not implemented'); }
  async update(_userId, _patch) { throw new Error('not implemented'); }
  async touchActive(_userId, _at) { throw new Error('not implemented'); }
  async listAll() { throw new Error('not implemented'); }
  async listByIds(_ids) { throw new Error('not implemented'); }
  async count() { throw new Error('not implemented'); }
}
