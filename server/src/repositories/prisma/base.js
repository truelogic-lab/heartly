/**
 * Shared helpers for Prisma repositories.
 */

import { toNumber } from '../../lib/prisma.js';

/** Convert BigInt fields to Number */
export function bigintFields(record, fields) {
  return toNumber(record, fields);
}

/** Convert BigInt fields in an array of records */
export function bigintFieldsMany(records, fields) {
  return records.map((r) => bigintFields(r, fields));
}

/**
 * Map Prisma unique-constraint errors to a domain-friendly shape.
 */
export function isUniqueConstraintError(err) {
  return err?.code === 'P2002';
}

export function isNotFoundError(err) {
  return err?.code === 'P2025';
}
