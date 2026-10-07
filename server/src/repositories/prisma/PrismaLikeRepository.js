import { prisma } from '../../lib/prisma.js';
import { LikeRepository } from '../../../src/engine/repositories/LikeRepository.js';
import { newLikeId } from '../../../src/engine/core/ids.js';

export class PrismaLikeRepository extends LikeRepository {
  /* ---------- Likes ---------- */

  async addLike({ fromUserId, toUserId, kind = 'like' }) {
    try {
      return await prisma.like.create({
        data: { id: newLikeId(), fromUserId, toUserId, kind },
      });
    } catch (e) {
      if (e.code === 'P2002') {
        return prisma.like.findUnique({
          where: { fromUserId_toUserId: { fromUserId, toUserId } },
        });
      }
      throw e;
    }
  }

  async findLike(fromUserId, toUserId) {
    return prisma.like.findUnique({
      where: { fromUserId_toUserId: { fromUserId, toUserId } },
    });
  }

  async hasLiked(fromUserId, toUserId) {
    const row = await this.findLike(fromUserId, toUserId);
    return Boolean(row);
  }

  async listOutbound(fromUserId) {
    return prisma.like.findMany({
      where: { fromUserId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listInbound(toUserId) {
    return prisma.like.findMany({
      where: { toUserId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countOutbound(fromUserId) {
    return prisma.like.count({ where: { fromUserId } });
  }

  async countInbound(toUserId) {
    return prisma.like.count({ where: { toUserId } });
  }

  async removeLike(fromUserId, toUserId) {
    try {
      await prisma.like.delete({
        where: { fromUserId_toUserId: { fromUserId, toUserId } },
      });
      return true;
    } catch (e) {
      if (e.code === 'P2025') return false;
      throw e;
    }
  }

  /* ---------- Passes ---------- */

  async addPass({ fromUserId, toUserId }) {
    try {
      return await prisma.pass.create({
        data: { id: newLikeId(), fromUserId, toUserId },
      });
    } catch (e) {
      if (e.code === 'P2002') {
        return prisma.pass.findUnique({
          where: { fromUserId_toUserId: { fromUserId, toUserId } },
        });
      }
      throw e;
    }
  }

  async hasPassed(fromUserId, toUserId) {
    const row = await prisma.pass.findUnique({
      where: { fromUserId_toUserId: { fromUserId, toUserId } },
    });
    return Boolean(row);
  }

  async listPasses(fromUserId) {
    return prisma.pass.findMany({ where: { fromUserId } });
  }

  async removePass(fromUserId, toUserId) {
    try {
      await prisma.pass.delete({
        where: { fromUserId_toUserId: { fromUserId, toUserId } },
      });
      return true;
    } catch (e) {
      if (e.code === 'P2025') return false;
      throw e;
    }
  }
}
