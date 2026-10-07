/**
 * LikeRepository — interface contract.
 *
 * @typedef {object} LikeRecord
 * @property {string} id
 * @property {string} fromUserId
 * @property {string} toUserId
 * @property {'like'|'super_like'} kind
 * @property {number} createdAt
 *
 * @typedef {object} PassRecord
 * @property {string} id
 * @property {string} fromUserId
 * @property {string} toUserId
 * @property {number} createdAt
 */
export class LikeRepository {
  /* Likes */
  async addLike(_data) { throw new Error('not implemented'); }
  async findLike(_fromUserId, _toUserId) { throw new Error('not implemented'); }
  async hasLiked(_fromUserId, _toUserId) { throw new Error('not implemented'); }
  async listOutbound(_fromUserId) { throw new Error('not implemented'); }
  async listInbound(_toUserId) { throw new Error('not implemented'); }
  async countOutbound(_fromUserId) { throw new Error('not implemented'); }
  async countInbound(_toUserId) { throw new Error('not implemented'); }
  async removeLike(_fromUserId, _toUserId) { throw new Error('not implemented'); }

  /* Passes */
  async addPass(_data) { throw new Error('not implemented'); }
  async hasPassed(_fromUserId, _toUserId) { throw new Error('not implemented'); }
  async listPasses(_fromUserId) { throw new Error('not implemented'); }
  async removePass(_fromUserId, _toUserId) { throw new Error('not implemented'); }
}
