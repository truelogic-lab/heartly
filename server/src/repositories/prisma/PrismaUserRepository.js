import { prisma } from '../../lib/prisma.js';
import { UserRepository } from '../../../../src/engine/repositories/UserRepository.js';
import { newUserId } from '../../../../src/engine/core/ids.js';

export class PrismaUserRepository extends UserRepository {
  async findById(id) { return prisma.user.findUnique({ where: { id } }); }
  async findByEmail(email) {
    if (!email) return null;
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }
  async create({ email, name, passwordHash }) {
    return prisma.user.create({
      data: { id: newUserId(), email: email.toLowerCase(), name: name ?? '', passwordHash: passwordHash ?? null },
    });
  }
  async update(id, patch) {
    try {
      return await prisma.user.update({
        where: { id },
        data: {
          ...(patch.email ? { email: patch.email.toLowerCase() } : {}),
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.passwordHash !== undefined ? { passwordHash: patch.passwordHash } : {}),
          ...(patch.deactivated !== undefined ? { deactivated: patch.deactivated } : {}),
        },
      });
    } catch (e) { if (e.code === 'P2025') return null; throw e; }
  }
  async delete(id) {
    try { await prisma.user.delete({ where: { id } }); return true; }
    catch (e) { if (e.code === 'P2025') return false; throw e; }
  }
  async listByIds(ids) {
    if (!ids?.length) return [];
    return prisma.user.findMany({ where: { id: { in: ids } } });
  }
  async count() { return prisma.user.count(); }
}
