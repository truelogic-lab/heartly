import { prisma } from '../lib/prisma.js';

/**
 * List users this viewer has blocked.
 * Returns each block + the blocked user's basic profile.
 */
export async function listBlocked(req, res) {
  const userId = req.user.id;

  const blocks = await prisma.block.findMany({
    where: { blockerId: userId },
    orderBy: { createdAt: 'desc' },
  });

  const blockedIds = blocks.map((b) => b.blockedId);
  const profiles = await prisma.profile.findMany({
    where: { userId: { in: blockedIds } },
  });

  const byId = new Map(profiles.map((p) => [p.userId, p]));

  const items = blocks.map((b) => {
    const p = byId.get(b.blockedId);
    return {
      blockId: b.id,
      userId: b.blockedId,
      blockedAt: b.createdAt.getTime(),
      profile: p
        ? {
            id: p.id,
            userId: p.userId,
            name: p.name,
            bio: p.bio || '',
            interests: p.interests || [],
            location: p.lat != null ? { lat: p.lat, lng: p.lng } : null,
          }
        : null,
    };
  });

  res.json({ items });
}

/** Unblock a user — deletes the block record. */
export async function unblock(req, res) {
  const userId = req.user.id;
  const { userId: targetId } = req.params;

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Not blocked', code: 'NOT_FOUND' });
  }

  await prisma.block.delete({ where: { id: existing.id } });

  // If there was a match between them, unmark blocked
  const [a, b] = [userId, targetId].sort();
  const match = await prisma.match.findUnique({
    where: { userAId_userBId: { userAId: a, userBId: b } },
  });
  if (match) {
    await prisma.match.update({
      where: { id: match.id },
      data: { blocked: false },
    });
  }

  res.json({ ok: true });
}

/** Get viewer's visibility preference (stored in profile.preferences). */
export async function getVisibility(req, res) {
  const userId = req.user.id;
  const profile = await prisma.profile.findUnique({ where: { userId } });
  const prefs = profile?.preferences || {};
  res.json({ visibility: prefs.visibility || 'everyone' });
}

/** Update viewer's visibility preference. */
export async function setVisibility(req, res) {
  const userId = req.user.id;
  const { visibility } = req.body || {};

  const ALLOWED = ['everyone', 'matches', 'nobody'];
  if (!ALLOWED.includes(visibility)) {
    return res.status(400).json({ error: 'Invalid visibility value', code: 'VALIDATION_FAILED' });
  }

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found', code: 'NOT_FOUND' });
  }

  const prefs = { ...(profile.preferences || {}), visibility };

  await prisma.profile.update({
    where: { userId },
    data: { preferences: prefs },
  });

  res.json({ ok: true, visibility });
}

/** Report a user and (by default) block them. */
export async function reportUser(req, res) {
  const reporterId = req.user.id;
  const { userId: reportedId } = req.params;
  const { reason, alsoBlock = true } = req.body || {};

  if (!reason || reason.trim().length < 3) {
    return res.status(400).json({ error: 'Reason required', code: 'VALIDATION_FAILED' });
  }
  if (reporterId === reportedId) {
    return res.status(400).json({ error: 'Cannot report yourself', code: 'SELF_ACTION' });
  }

  const report = await prisma.report.create({
    data: {
      reporterId,
      reportedId,
      reason: reason.trim(),
    },
  });

  if (alsoBlock) {
    try {
      await prisma.block.create({
        data: {
          blockerId: reporterId,
          blockedId: reportedId,
        },
      });
    } catch (e) {
      // Already blocked — ignore
      if (e.code !== 'P2002') throw e;
    }
  }

  res.status(201).json({
    id: report.id,
    reportedId,
    reason: report.reason,
    createdAt: report.createdAt.getTime(),
  });
}
