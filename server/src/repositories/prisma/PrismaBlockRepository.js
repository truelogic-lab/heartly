import { prisma } from '../../lib/prisma.js';
import { BlockRepository } from '../../engine/repositories/BlockRepository.js';
import { newBlockId } from '../../engine/core/ids.js';

function shape(b) {
  if (!b) return null;
  return { id: b.id, blockerId: b.blockerId, blockedId: b.blockedId, createdAt: b.createdAt.getTime() };
}

export class PrismaBlockRepository extends BlockRepository {
  async add({ blockerId, blockedId }) {
    try {
      const b = await prisma.block.create({ data: { id: newBlockId(), blockerId, blockedId } });
      return shape(b);
    } catch (e) {
      if (e.code === 'P2002') return this.find(blockerId, blockedId);
      throw e;
    }
  }
  async find(blockerId, blockedId) {
    return shape(await prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId, blockedId } } }));
  }
  async isBlockedEitherDirection(a, b) {
    const count = await prisma.block.count({
      where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
    });
    return count > 0;
  }
  async listByBlocker(blockerId) {
    return (await prisma.block.findMany({ where: { blockerId } })).map(shape);
  }
  async listInvolvingUser(userId) {
    return (await prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    })).map(shape);
  }
  async remove(blockerId, blockedId) {
    try { await prisma.block.delete({ where: { blockerId_blockedId: { blockerId, blockedId } } }); return true; }
    catch (e) { if (e.code === 'P2025') return false; throw e; }
  }
}
