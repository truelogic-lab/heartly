-- =========================================================
-- Heartly — initial schema
-- Generated from prisma/schema.prisma
-- =========================================================

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  "passwordHash"  TEXT,
  deactivated     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS profiles (
  id              TEXT PRIMARY KEY,
  "userId"        TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT '',
  bio             TEXT NOT NULL DEFAULT '',
  birthdate       BIGINT,
  gender          TEXT,
  "lookingFor"    TEXT NOT NULL DEFAULT 'everyone',
  intention       TEXT,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  interests       TEXT[] NOT NULL DEFAULT '{}',
  preferences     JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified        BOOLEAN NOT NULL DEFAULT false,
  deactivated     BOOLEAN NOT NULL DEFAULT false,
  "lastActiveAt"  BIGINT NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS profiles_userId_idx        ON profiles("userId");
CREATE INDEX IF NOT EXISTS profiles_deactivated_idx   ON profiles(deactivated);
CREATE INDEX IF NOT EXISTS profiles_lastActiveAt_idx  ON profiles("lastActiveAt");
CREATE INDEX IF NOT EXISTS profiles_gender_idx        ON profiles(gender);

-- ---------- photos ----------
CREATE TABLE IF NOT EXISTS photos (
  id           TEXT PRIMARY KEY,
  "userId"     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  "order"      INTEGER NOT NULL DEFAULT 0,
  "isPrimary"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS photos_userId_idx        ON photos("userId");
CREATE INDEX IF NOT EXISTS photos_userId_order_idx  ON photos("userId", "order");

-- ---------- likes ----------
CREATE TABLE IF NOT EXISTS likes (
  id            TEXT PRIMARY KEY,
  "fromUserId"  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "toUserId"    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL DEFAULT 'like',
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("fromUserId", "toUserId")
);
CREATE INDEX IF NOT EXISTS likes_fromUserId_idx ON likes("fromUserId");
CREATE INDEX IF NOT EXISTS likes_toUserId_idx   ON likes("toUserId");

-- ---------- passes ----------
CREATE TABLE IF NOT EXISTS passes (
  id            TEXT PRIMARY KEY,
  "fromUserId"  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "toUserId"    TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("fromUserId", "toUserId")
);
CREATE INDEX IF NOT EXISTS passes_fromUserId_idx ON passes("fromUserId");

-- ---------- matches ----------
CREATE TABLE IF NOT EXISTS matches (
  id                     TEXT PRIMARY KEY,
  "userAId"              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "userBId"              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "lastMessageAt"        BIGINT NOT NULL DEFAULT 0,
  "lastMessagePreview"   TEXT NOT NULL DEFAULT '',
  blocked                BOOLEAN NOT NULL DEFAULT false,
  deleted                BOOLEAN NOT NULL DEFAULT false,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userAId", "userBId")
);
CREATE INDEX IF NOT EXISTS matches_userAId_deleted_idx  ON matches("userAId", deleted);
CREATE INDEX IF NOT EXISTS matches_userBId_deleted_idx  ON matches("userBId", deleted);
CREATE INDEX IF NOT EXISTS matches_lastMessageAt_idx    ON matches("lastMessageAt");

-- ---------- messages ----------
CREATE TABLE IF NOT EXISTS messages (
  id           TEXT PRIMARY KEY,
  "matchId"    TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  "senderId"   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  read         BOOLEAN NOT NULL DEFAULT false,
  "readAt"     BIGINT NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS messages_matchId_createdAt_idx ON messages("matchId", "createdAt");
CREATE INDEX IF NOT EXISTS messages_senderId_idx          ON messages("senderId");

-- ---------- blocks ----------
CREATE TABLE IF NOT EXISTS blocks (
  id           TEXT PRIMARY KEY,
  "blockerId"  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "blockedId"  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("blockerId", "blockedId")
);
CREATE INDEX IF NOT EXISTS blocks_blockerId_idx ON blocks("blockerId");
CREATE INDEX IF NOT EXISTS blocks_blockedId_idx ON blocks("blockedId");

-- ---------- prompts ----------
CREATE TABLE IF NOT EXISTS prompts (
  id           TEXT PRIMARY KEY,
  "userId"     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "promptId"   TEXT NOT NULL,
  answer       TEXT NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "promptId")
);
CREATE INDEX IF NOT EXISTS prompts_userId_idx ON prompts("userId");

-- ---------- reports ----------
CREATE TABLE IF NOT EXISTS reports (
  id            TEXT PRIMARY KEY,
  "reporterId"  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "reportedId"  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reports_reporterId_idx ON reports("reporterId");
CREATE INDEX IF NOT EXISTS reports_reportedId_idx ON reports("reportedId");

-- ---------- _prisma_migrations (for compatibility) ----------
CREATE TABLE IF NOT EXISTS _prisma_migrations (
  id                    TEXT PRIMARY KEY,
  checksum              TEXT NOT NULL,
  finished_at           TIMESTAMPTZ,
  migration_name        TEXT NOT NULL,
  logs                  TEXT,
  rolled_back_at        TIMESTAMPTZ,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_steps_count   INTEGER NOT NULL DEFAULT 0
);
