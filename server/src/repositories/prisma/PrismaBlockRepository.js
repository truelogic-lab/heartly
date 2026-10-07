import { prisma } from '../../lib/prisma.js';
import { BlockRepository } from '../../../src/engine/repositories/BlockRepository.js';
import { newBlockId } from '../../../src/engine/core/ids.js';

function shape(b) {
  if (!b) return null;
  return {
    id: b.id,
    blockerId: b.blockerId,
    blockedId: b.blockedId,
    createdAt: b.createdAt.getTime(),
  };
}

export class PrismaBlockRepository extends BlockRepository {
  async add({ blockerId, blockedId }) {
    try {
      const b = await prisma.block.create({
        data: { id: newBlockId(), blockerId, blockedId },
      });
      return shape(b);
    } catch (e) {
      if (e.code === 'P2002') {
        return this.find(blockerId, blockedId);
      }
      throw e;
    }
  }

  async find(blockerId, blockedId) {
    const b = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    return shape(b);
  }

  async isBlockedEitherDirection(a, b) {
    const count = await prisma.block.count({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
    });
    return count > 0;
  }

  async listByBlocker(blockerId) {
    const rows = await prisma.block.findMany({ where: { blockerId } });
    return rows.map(shape);
  }

  async listInvolvingUser(userId) {
    const rows = await prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    });
    return rows.map(shape);
  }

  async remove(blockerId, blockedId) {
    try {
      await prisma.block.delete({
        where: { blockerId_blockedId: { blockerId, blockedId } },
      });
      return true;
    } catch (e) {
      if (e.code === 'P2025') return false;
      throw e;
    }
  }
}
