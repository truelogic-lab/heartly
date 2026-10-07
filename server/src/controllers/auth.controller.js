import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import {
  signAccess, signRefresh, verifyRefresh, cookieOptions,
} from '../lib/jwt.js';
import { newUserId, newProfileId } from '../engine/core/ids.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;

function issueTokens(res, user) {
  const access = signAccess(user);
  const refresh = signRefresh(user);
  res.cookie('access_token', access, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refresh, cookieOptions);
  return { access, refresh };
}

/* ---------- register ---------- */

export async function register(req, res) {
  const { email, password, name } = req.body || {};

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Valid email required', code: 'EMAIL_INVALID' });
  }
  if (!password || password.length < PASSWORD_MIN) {
    return res.status(400).json({ error: `Password must be at least ${PASSWORD_MIN} characters`, code: 'PASSWORD_TOO_SHORT' });
  }
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name required', code: 'NAME_INVALID' });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered', code: 'EMAIL_TAKEN' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      id: newUserId(),
      email: email.toLowerCase(),
      name: name.trim(),
      passwordHash,
      profile: {
        create: { id: newProfileId(), name: name.trim() },
      },
    },
    select: { id: true, email: true, name: true },
  });

  const tokens = issueTokens(res, user);
  res.status(201).json({ user, ...tokens });
}

/* ---------- login ---------- */

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required', code: 'VALIDATION_FAILED' });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
  }

  const safe = { id: user.id, email: user.email, name: user.name };
  const tokens = issueTokens(res, safe);
  res.json({ user: safe, ...tokens });
}

/* ---------- refresh ---------- */

export async function refresh(req, res) {
  try {
    const token = req.cookies?.refresh_token || req.body?.refresh;
    if (!token) {
      return res.status(401).json({ error: 'No refresh token', code: 'REFRESH_MISSING' });
    }

    const payload = verifyRefresh(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const tokens = issueTokens(res, user);
    res.json({ user, ...tokens });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token', code: 'REFRESH_INVALID' });
  }
}

/* ---------- logout ---------- */

export async function logout(_req, res) {
  res.clearCookie('access_token', cookieOptions);
  res.clearCookie('refresh_token', cookieOptions);
  res.json({ ok: true });
}

/* ---------- me ---------- */

export async function me(req, res) {
  const profile = await prisma.profile.findUnique({
    where: { userId: req.user.id },
  });
  res.json({
    user: req.user,
    profile: profile
      ? {
          id: profile.id,
          userId: profile.userId,
          name: profile.name,
          birthdate: profile.birthdate != null ? Number(profile.birthdate) : null,
          gender: profile.gender,
          lookingFor: profile.lookingFor,
          location: profile.lat != null ? { lat: profile.lat, lng: profile.lng } : null,
          interests: profile.interests || [],
          verified: profile.verified,
        }
      : null,
  });
}
