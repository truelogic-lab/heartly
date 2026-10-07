# Heartly Repository Layer

Every repository here is a **contract**, not an implementation.

The engine depends on these contracts. It does not know
whether the data lives in memory, PostgreSQL, or anywhere else.

## Contract rules

1. All methods are **async** — they return Promises, always.
2. No business logic lives here. Only storage and retrieval.
3. Missing records return `null` (finders) or no-op (deleters).
4. Lists have a deterministic order (documented per method).

## How the database plugs in later

To connect Prisma/PostgreSQL:

1. Create `src/engine/repositories/prisma/`
2. Write e.g. `PrismaUserRepository.js` implementing the same
   method signatures as `MemoryUserRepository.js`
3. In `container.js`, swap the memory class for the Prisma class
4. Nothing else changes — no engine file is touched
5. Delete the memory implementation only if you want
