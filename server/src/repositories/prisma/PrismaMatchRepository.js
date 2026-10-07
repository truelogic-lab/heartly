import { prisma } from '../../lib/prisma.js';
import { MatchRepository } from '../../../src/engine/repositories/MatchRepository.js';

function shape(m) {
  if (!m) return null;
  return {
    id: m.id,
    users: [m.userAId, m.userBId].sort(),
    createdAt: m.createdAt.getTime(),
    lastMessageAt: Number(m.lastMessageAt ?? 0),
    lastMessagePreview: m.lastMessagePreview ?? '',
    blocked: m.blocked,
    deleted: m.deleted,
  };
}

export class PrismaMatchRepository extends MatchRepository {
  async findById(id) {
    const m = await prisma.match.findUnique({ where: { id } });
    return shape(m);
  }

  async findBetween(userA, userB) {
    const [a, b] = [userA, userB].sort();
    const m = await prisma.match.findUnique({
      where: { userAId_userBId: { userAId: a, userBId: b } },
    });
    return shape(m);
  }

  async create({ id, users, blocked = false, deleted = false }) {
    const [a, b] = [...users].sort();
    try {
      const m = await prisma.match.create({
        data: {
          id,
          userAId: a,
          userBId: b,
          blocked,
          deleted,
          lastMessageAt: BigInt(0),
        },
      });
      return shape(m);
    } catch (e) {
      if (e.code === 'P2002') {
        return this.findBetween(a, b);
      }
      throw e;
    }
  }

  async listForUser(userId) {
    const rows = await prisma.match.findMany({
      where: {
        deleted: false,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(shape);
  }

  async update(id, patch) {
    const data = {};
    if (patch.lastMessageAt !== undefined) {
      data.lastMessageAt = BigInt(patch.lastMessageAt);
    }
    if (patch.lastMessagePreview !== undefined) {
      data.lastMessagePreview = patch.lastMessagePreview;
    }
    if (patch.blocked !== undefined) data.blocked = patch.blocked;
    if (patch.deleted !== undefined) data.deleted = patch.deleted;

    try {
      const m = await prisma.match.update({ where: { id }, data });
      return shape(m);
    } catch (e) {
      if (e.code === 'P2025') return null;
      throw e;
    }
  }

  async softDelete(id) {
    return this.update(id, { deleted: true });
  }

  async countForUser(userId) {
    return prisma.match.count({
      where: {
        deleted: false,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });
  }
}
