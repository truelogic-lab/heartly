import { prisma } from '../../lib/prisma.js';
import { ProfileRepository } from '../../../src/engine/repositories/ProfileRepository.js';
import { newProfileId } from '../../../src/engine/core/ids.js';

const BIGINT_FIELDS = ['birthdate', 'lastActiveAt'];

function shape(p) {
  if (!p) return null;
  return {
    ...p,
    birthdate: p.birthdate != null ? Number(p.birthdate) : null,
    lastActiveAt: Number(p.lastActiveAt ?? 0),
    location:
      p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null,
    preferences: p.preferences || {},
    interests: p.interests || [],
  };
}

export class PrismaProfileRepository extends ProfileRepository {
  async findByUserId(userId) {
    const p = await prisma.profile.findUnique({ where: { userId } });
    return shape(p);
  }

  async create({ userId, ...rest }) {
    const p = await prisma.profile.create({
      data: {
        id: newProfileId(),
        userId,
        name: rest.name ?? '',
        bio: rest.bio ?? '',
        birthdate: rest.birthdate != null ? BigInt(rest.birthdate) : null,
        gender: rest.gender ?? null,
        lookingFor: rest.lookingFor ?? 'everyone',
        intention: rest.intention ?? null,
        lat: rest.location?.lat ?? null,
        lng: rest.location?.lng ?? null,
        interests: rest.interests ?? [],
        preferences: rest.preferences ?? {},
        verified: rest.verified ?? false,
        deactivated: rest.deactivated ?? false,
        lastActiveAt: BigInt(rest.lastActiveAt ?? Date.now()),
      },
    });
    return shape(p);
  }

  async update(userId, patch) {
    const data = {};
    if (patch.name !== undefined) data.name = patch.name;
    if (patch.bio !== undefined) data.bio = patch.bio;
    if (patch.birthdate !== undefined) {
      data.birthdate = patch.birthdate != null ? BigInt(patch.birthdate) : null;
    }
    if (patch.gender !== undefined) data.gender = patch.gender;
    if (patch.lookingFor !== undefined) data.lookingFor = patch.lookingFor;
    if (patch.intention !== undefined) data.intention = patch.intention;
    if (patch.location !== undefined) {
      data.lat = patch.location?.lat ?? null;
      data.lng = patch.location?.lng ?? null;
    }
    if (patch.interests !== undefined) data.interests = patch.interests;
    if (patch.preferences !== undefined) data.preferences = patch.preferences;
    if (patch.verified !== undefined) data.verified = patch.verified;
    if (patch.deactivated !== undefined) data.deactivated = patch.deactivated;
    if (patch.lastActiveAt !== undefined) {
      data.lastActiveAt = BigInt(patch.lastActiveAt);
    }

    try {
      const p = await prisma.profile.update({ where: { userId }, data });
      return shape(p);
    } catch (e) {
      if (e.code === 'P2025') return null;
      throw e;
    }
  }

  async touchActive(userId, at) {
    try {
      const p = await prisma.profile.update({
        where: { userId },
        data: { lastActiveAt: BigInt(at) },
      });
      return shape(p);
    } catch (e) {
      if (e.code === 'P2025') return null;
      throw e;
    }
  }

  async listAll() {
    const rows = await prisma.profile.findMany();
    return rows.map(shape);
  }

  async listByIds(ids) {
    if (!ids?.length) return [];
    const rows = await prisma.profile.findMany({ where: { userId: { in: ids } } });
    return rows.map(shape);
  }

  async count() {
    return prisma.profile.count();
  }
}
