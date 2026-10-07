import { prisma } from '../../lib/prisma.js';
import { PromptRepository } from '../../../src/engine/repositories/PromptRepository.js';
import { newPromptId } from '../../../src/engine/core/ids.js';

function shape(p) {
  if (!p) return null;
  return {
    id: p.id,
    userId: p.userId,
    promptId: p.promptId,
    answer: p.answer,
    createdAt: p.createdAt.getTime(),
    updatedAt: p.updatedAt.getTime(),
  };
}

export class PrismaPromptRepository extends PromptRepository {
  async listByUserId(userId) {
    const rows = await prisma.prompt.findMany({ where: { userId } });
    return rows.map(shape);
  }

  async upsert({ userId, promptId, answer }) {
    const p = await prisma.prompt.upsert({
      where: { userId_promptId: { userId, promptId } },
      update: { answer },
      create: { id: newPromptId(), userId, promptId, answer },
    });
    return shape(p);
  }

  async delete(userId, promptId) {
    try {
      await prisma.prompt.delete({
        where: { userId_promptId: { userId, promptId } },
      });
      return true;
    } catch (e) {
      if (e.code === 'P2025') return false;
      throw e;
    }
  }

  async countForUser(userId) {
    return prisma.prompt.count({ where: { userId } });
  }
}
