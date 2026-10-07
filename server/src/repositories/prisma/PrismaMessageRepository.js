import { prisma } from '../../lib/prisma.js';
import { MessageRepository } from '../../../src/engine/repositories/MessageRepository.js';
import { newMessageId } from '../../../src/engine/core/ids.js';

function shape(m) {
  if (!m) return null;
  return {
    id: m.id,
    matchId: m.matchId,
    senderId: m.senderId,
    body: m.body,
    createdAt: m.createdAt.getTime(),
    read: m.read,
    readAt: Number(m.readAt ?? 0),
  };
}

export class PrismaMessageRepository extends MessageRepository {
  async add({ matchId, senderId, body }) {
    const m = await prisma.message.create({
      data: { id: newMessageId(), matchId, senderId, body },
    });
    return shape(m);
  }

  async listByMatch(matchId, { limit = 100, beforeMs } = {}) {
    const rows = await prisma.message.findMany({
      where: {
        matchId,
        ...(beforeMs ? { createdAt: { lt: new Date(beforeMs) } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return rows.map(shape);
  }

  async countByMatch(matchId) {
    return prisma.message.count({ where: { matchId } });
  }

  async markRead(matchId, readerId, at) {
    const result = await prisma.message.updateMany({
      where: { matchId, senderId: { not: readerId }, read: false },
      data: { read: true, readAt: BigInt(at) },
    });
    return result.count;
  }

  async delete(id) {
    try {
      await prisma.message.delete({ where: { id } });
      return true;
    } catch (e) {
      if (e.code === 'P2025') return false;
      throw e;
    }
  }

  async latestForMatch(matchId) {
    const m = await prisma.message.findFirst({
      where: { matchId },
      orderBy: { createdAt: 'desc' },
    });
    return shape(m);
  }
}
