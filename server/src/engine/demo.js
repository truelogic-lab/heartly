/**
 * Heartly Dating Engine — demo.
 *
 * Runs the full flow end-to-end against the in-memory engine.
 * No database required.
 *
 * Run:  node src/engine/demo.js
 * Or:   npm run demo:engine
 */

import { createEngine, ManualClock } from './index.js';

const NOW = Date.UTC(2025, 5, 15, 12, 0, 0);
const clock = new ManualClock(NOW);
const engine = createEngine({ clock });

/* ---------- helpers ---------- */

function line(label) {
  console.log('\n' + '─'.repeat(72));
  console.log('▸ ' + label);
  console.log('─'.repeat(72));
}

function step(label) {
  console.log('\n  · ' + label);
}

function log(...args) {
  console.log('    ', ...args);
}

/* ---------- seed users ---------- */

function personProfile(i) {
  const lat = 40.7 + (i - 3) * 0.005;
  const lng = -74.0 + (i - 3) * 0.005;
  const interests = [
    ['travel', 'music', 'coffee'],
    ['travel', 'photography', 'coffee'],
    ['music', 'hiking', 'coffee'],
    ['travel', 'cooking', 'movies'],
    ['photography', 'art', 'coffee'],
    ['travel', 'music', 'hiking'],
  ][i % 6];
  return {
    name: ['Sophie', 'Marcus', 'Priya', 'Diego', 'Isla', 'Andre'][i % 6] + ` ${i}`,
    birthdate: Date.UTC(1996 + (i % 4), i % 12, 1 + (i % 28)),
    gender: i % 2 === 0 ? 'woman' : 'man',
    location: { lat, lng },
    interests,
    verified: i % 2 === 0,
    bio: 'Hello from user ' + i,
    lastActiveAt: NOW - i * 60_000,
    preferences: {
      minAge: 20,
      maxAge: 45,
      maxDistanceKm: 50,
      lookingFor: 'everyone',
    },
  };
}

/* ============================================================
   DEMO START
   ============================================================ */

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║           Heartly Dating Engine — Live Demo                 ║');
console.log('║           ' + new Date(NOW).toISOString().padEnd(54) + '║');
console.log('╚══════════════════════════════════════════════════════════════╝');

/* ---------- 1. Seed ---------- */

line('1. Seeding 8 user profiles');

const userIds = [];
for (let i = 0; i < 8; i++) {
  const u = await engine.repositories.users.create({
    email: `user${i}@heartly.app`,
    name: `User ${i}`,
  });
  await engine.services.profile.ensureProfile(u.id, personProfile(i));
  userIds.push(u.id);
}

log(`Created ${userIds.length} users.`);
log(`Viewer: ${userIds[0]}`);

const viewerId = userIds[0];

/* ---------- 2. Subscribe to events ---------- */

line('2. Subscribing to engine events');

const events = [];
engine.events.subscribe('like.created', (e) => events.push({ t: e.type, from: e.fromUserId, to: e.toUserId }));
engine.events.subscribe('match.created', (e) => events.push({ t: e.type, matchId: e.matchId, users: e.users }));
engine.events.subscribe('message.sent', (e) => events.push({ t: e.type, matchId: e.matchId }));
engine.events.subscribe('user.blocked', (e) => events.push({ t: e.type, blocker: e.blockerId, blocked: e.blockedId }));

log('Subscribed to 4 event types.');

/* ---------- 3. Compatibility scores ---------- */

line('3. Compatibility scores vs the viewer');

for (let i = 1; i < 6; i++) {
  const a = await engine.services.profile.getEnriched(viewerId);
  const b = await engine.services.profile.getEnriched(userIds[i]);
  const score = engine.engines.compatibility.score(a, b);
  const breakdown = engine.engines.compatibility.breakdown(a, b);
  log(
    `${b.name.padEnd(12)} · score ${String(score).padStart(3)} ` +
    `· interests ${(breakdown.sharedInterests * 100).toFixed(0)}% ` +
    `· distance ${(breakdown.distance * 100).toFixed(0)}%`
  );
}

/* ---------- 4. Discovery feed ---------- */

line('4. Discovery feed (top 5)');

const feed = await engine.services.discovery.feedFor(viewerId, { limit: 5 });
feed.forEach((row, i) => {
  log(
    `${(i + 1).toString().padStart(2)}. ` +
    `${row.profile.name.padEnd(12)} ` +
    `· compat ${String(row.compatibility).padStart(3)} ` +
    `· rank ${(row.rankingScore * 100).toFixed(0)}%`
  );
});

/* ---------- 5. Daily picks ---------- */

line('5. Daily Picks (deterministic per day)');

const picks1 = await engine.services.recommendation.dailyPicks(viewerId, '2026-10-07');
const picks2 = await engine.services.recommendation.dailyPicks(viewerId, '2026-10-07');

log('Picks for 2026-10-07:');
picks1.forEach((p, i) => log(`  ${i + 1}. ${p.profile.name} (compat ${p.compatibility})`));
log('Same input twice?', picks1.map(p => p.profile.userId).join() === picks2.map(p => p.profile.userId).join() ? 'YES ✔' : 'NO ✗');

/* ---------- 6. Online now ---------- */

line('6. Online Now (sorted by recency)');

const online = await engine.services.recommendation.onlineNow(viewerId, 5);
online.forEach((p, i) => log(`  ${i + 1}. ${p.profile.name}`));

/* ---------- 7. Create a match ---------- */

line('7. Creating a match');

const target = userIds[1];
const like1 = await engine.services.like.like(viewerId, target);
log(`Viewer → target: matched=${like1.matched}`);

const like2 = await engine.services.like.like(target, viewerId);
log(`Target → viewer: matched=${like2.matched}`);
log(`Match id: ${like2.match.id}`);
log(`Match users: ${like2.match.users.join(', ')}`);

/* ---------- 8. Send messages ---------- */

line('8. Sending messages in the match');

await engine.services.message.send(like2.match.id, viewerId, 'Hey! We both love coffee ☕');
engine.clock.tick(60_000);
await engine.services.message.send(like2.match.id, target, 'Yes! Know a good place?');
engine.clock.tick(30_000);
await engine.services.message.send(like2.match.id, viewerId, 'There is one on 5th.');

const conv = await engine.services.message.getConversation(like2.match.id, viewerId);
conv.messages.forEach((m) => log(`  [${m.senderId === viewerId ? 'me' : 'them'}] ${m.body}`));

/* ---------- 9. Block someone ---------- */

line('9. Blocking a user');

const blockedId = userIds[2];
await engine.services.safety.block(viewerId, blockedId);
log(`Blocked ${blockedId}.`);

const feedAfter = await engine.services.discovery.feedFor(viewerId);
const stillThere = feedAfter.some((r) => r.profile.userId === blockedId);
log(`Blocked user still in feed? ${stillThere ? 'YES ✗' : 'NO ✔'}`);

/* ---------- 10. Event summary ---------- */

line('10. Event summary');

const byType = events.reduce((acc, e) => {
  acc[e.t] = (acc[e.t] || 0) + 1;
  return acc;
}, {});
Object.entries(byType).forEach(([k, v]) => log(`${k.padEnd(20)} ${v}`));

/* ---------- done ---------- */

console.log('\n' + '═'.repeat(72));
console.log(' Demo complete. 8 users · ' + events.length + ' events · 1 match · 3 messages · 1 block.');
console.log('═'.repeat(72) + '\n');
