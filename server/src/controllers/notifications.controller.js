import { prisma } from '../lib/prisma.js';

/**
 * Notifications are derived from recent activity:
 *   - New likes received (last 7 days)
 *   - New matches (last 7 days)
 *   - New messages (last 7 days, unread)
 *
 * No separate table — we compute on the fly. This scales fine at
 * our size and avoids the complexity of a real notification system.
 */
export async function listNotifications(req, res) {
  const userId = req.user.id;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [likes, matches, unreadMessages] = await Promise.all([
    prisma.like.findMany({
      where: { toUserId: userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.match.findMany({
      where: {
        deleted: false,
        OR: [{ userAId: userId }, { userBId: userId }],
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.message.findMany({
      where: {
        match: {
          OR: [{ userAId: userId }, { userBId: userId }],
          deleted: false,
        },
        senderId: { not: userId },
        read: false,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { match: true },
    }),
  ]);

  // Get the profiles for likes
  const likerIds = likes.map((l) => l.fromUserId);
  const likerProfiles = await prisma.profile.findMany({
    where: { userId: { in: likerIds } },
  });
  const profileByUserId = new Map(likerProfiles.map((p) => [p.userId, p]));

  const matchIds = matches.map((m) => m.id);
  const matchUserIds = matches.flatMap((m) => m.users || [m.userAId, m.userBId]);
  const matchProfiles = await prisma.profile.findMany({
    where: { userId: { in: matchUserIds } },
  });
  const matchProfileByUserId = new Map(matchProfiles.map((p) => [p.userId, p]));

  const messageMatchIds = unreadMessages.map((m) => m.matchId);
  const messageMatches = await prisma.match.findMany({
    where: { id: { in: messageMatchIds } },
  });
  const messageMatchMap = new Map(messageMatches.map((m) => [m.id, m]));

  const messageSenderIds = unreadMessages.map((m) => m.senderId);
  const messageSenderProfiles = await prisma.profile.findMany({
    where: { userId: { in: messageSenderIds } },
  });
  const senderProfileByUserId = new Map(messageSenderProfiles.map((p) => [p.userId, p]));

  const items = [];

  for (const l of likes) {
    const p = profileByUserId.get(l.fromUserId);
    if (!p) continue;
    items.push({
      id: `like-${l.id}`,
      type: 'like',
      kind: l.kind,
      at: l.createdAt.getTime(),
      user: {
        userId: p.userId,
        name: p.name,
        initials: (p.name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase(),
      },
      text: l.kind === 'super_like'
        ? `${p.name} super liked you`
        : `${p.name} liked your profile`,
      actionTo: `/user/${p.userId}`,
    });
  }

  for (const m of matches) {
    const otherId = [m.userAId, m.userBId].find((id) => id !== userId);
    const p = otherId ? matchProfileByUserId.get(otherId) : null;
    if (!p) continue;
    items.push({
      id: `match-${m.id}`,
      type: 'match',
      at: m.createdAt.getTime(),
      user: {
        userId: p.userId,
        name: p.name,
        initials: (p.name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase(),
      },
      text: `You matched with ${p.name}`,
      actionTo: `/match/${m.id}`,
    });
  }

  for (const msg of unreadMessages) {
    const p = senderProfileByUserId.get(msg.senderId);
    if (!p) continue;
    items.push({
      id: `msg-${msg.id}`,
      type: 'message',
      at: msg.createdAt.getTime(),
      user: {
        userId: p.userId,
        name: p.name,
        initials: (p.name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase(),
      },
      text: `${p.name}: ${(msg.body || '').slice(0, 60)}${msg.body?.length > 60 ? '…' : ''}`,
      actionTo: `/chat/${msg.matchId}`,
    });
  }

  items.sort((a, b) => b.at - a.at);

  res.json({ items: items.slice(0, 30) });
}

export async function unreadCount(req, res) {
  const userId = req.user.id;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [likes, matches, messages] = await Promise.all([
    prisma.like.count({ where: { toUserId: userId, createdAt: { gte: since } } }),
    prisma.match.count({
      where: {
        deleted: false,
        OR: [{ userAId: userId }, { userBId: userId }],
        createdAt: { gte: since },
      },
    }),
    prisma.message.count({
      where: {
        match: { OR: [{ userAId: userId }, { userBId: userId }], deleted: false },
        senderId: { not: userId },
        read: false,
        createdAt: { gte: since },
      },
    }),
  ]);

  res.json({ total: likes + matches + messages, likes, matches, messages });
}
