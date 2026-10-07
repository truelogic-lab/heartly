import { toNumber } from '../../lib/prisma.js';

export function bigintFields(record, fields) {
  return toNumber(record, fields);
}

export function bigintFieldsMany(records, fields) {
  return records.map((r) => bigintFields(r, fields));
}

export function isUniqueConstraintError(err) {
  return err?.code === 'P2002';
}

export function isNotFoundError(err) {
  return err?.code === 'P2025';
}
