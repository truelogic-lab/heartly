/**
 * Prisma client — native driver.
 *
 * On Render (x86_64 Linux), Prisma's native query engine works
 * without any adapter. This file is intentionally simple.
 */

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

/* ---------- BigInt helpers ---------- */

export function bigIntToNumber(value) {
  if (typeof value === 'bigint') return Number(value);
  if (value === null || value === undefined) return value;
  return value;
}

export function toNumber(record, fields) {
  if (!record) return record;
  const out = { ...record };
  for (const f of fields) {
    if (out[f] !== undefined) out[f] = bigIntToNumber(out[f]);
  }
  return out;
}
