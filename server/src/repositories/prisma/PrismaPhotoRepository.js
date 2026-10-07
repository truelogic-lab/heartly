import { prisma } from '../../lib/prisma.js';
import { PhotoRepository } from '../../engine/repositories/PhotoRepository.js';
import { newPhotoId } from '../../engine/core/ids.js';

function shape(p) {
  if (!p) return null;
  return { id: p.id, userId: p.userId, url: p.url, order: p.order, isPrimary: p.isPrimary, createdAt: p.createdAt.getTime() };
}

export class PrismaPhotoRepository extends PhotoRepository {
  async listByUserId(userId) {
    return (await prisma.photo.findMany({ where: { userId }, orderBy: { order: 'asc' } })).map(shape);
  }
  async add({ userId, url, isPrimary = false }) {
    const count = await prisma.photo.count({ where: { userId } });
    const p = await prisma.photo.create({
      data: { id: newPhotoId(), userId, url, order: count, isPrimary: isPrimary || count === 0 },
    });
    return shape(p);
  }
  async delete(id) {
    try { await prisma.photo.delete({ where: { id } }); return true; }
    catch (e) { if (e.code === 'P2025') return false; throw e; }
  }
  async deleteAllForUser(userId) { await prisma.photo.deleteMany({ where: { userId } }); }
  async countForUser(userId) { return prisma.photo.count({ where: { userId } }); }
}
