import { supabase } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';
import { newPhotoId } from '../../../src/engine/core/ids.js';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'avatars';
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

function safeName(originalName, userId) {
  const ext = (originalName.split('.').pop() || 'jpg').toLowerCase();
  const random = Math.random().toString(36).slice(2, 10);
  return `${userId}/${Date.now()}-${random}.${ext}`;
}

export async function uploadAvatar(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: 'Storage not configured', code: 'STORAGE_DISABLED' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded', code: 'NO_FILE' });
  }

  if (!ALLOWED.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Unsupported image type', code: 'BAD_MIME' });
  }

  if (req.file.size > MAX_BYTES) {
    return res.status(400).json({ error: 'File too large (8 MB max)', code: 'TOO_LARGE' });
  }

  const userId = req.user.id;
  const path = safeName(req.file.originalname, userId);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (error) {
    return res.status(500).json({ error: error.message, code: 'UPLOAD_FAILED' });
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Record the photo in the database
  const photo = await prisma.photo.create({
    data: {
      id: newPhotoId(),
      userId,
      url: publicUrl.publicUrl,
      order: 0,
      isPrimary: true,
    },
  });

  // Reset any previous primary flags for this user
  await prisma.photo.updateMany({
    where: { userId, id: { not: photo.id } },
    data: { isPrimary: false },
  });

  res.status(201).json({
    id: photo.id,
    url: photo.url,
    isPrimary: photo.isPrimary,
  });
}

/* =========================================================
   Gallery photo management
   ========================================================= */

export async function uploadPhoto(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: 'Storage not configured', code: 'STORAGE_DISABLED' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded', code: 'NO_FILE' });
  }

  if (!ALLOWED.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Unsupported image type', code: 'BAD_MIME' });
  }

  if (req.file.size > MAX_BYTES) {
    return res.status(400).json({ error: 'File too large (8 MB max)', code: 'TOO_LARGE' });
  }

  const userId = req.user.id;

  // Enforce max photos
  const count = await prisma.photo.count({ where: { userId } });
  if (count >= 6) {
    return res.status(409).json({ error: 'Photo limit reached (max 6)', code: 'PHOTO_LIMIT' });
  }

  const path = safeName(req.file.originalname, userId);
  const { error } = await supabase.storage.from(BUCKET).upload(path, req.file.buffer, {
    contentType: req.file.mimetype,
    upsert: false,
  });
  if (error) return res.status(500).json({ error: error.message, code: 'UPLOAD_FAILED' });

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const photo = await prisma.photo.create({
    data: {
      id: newPhotoId(),
      userId,
      url: publicUrl.publicUrl,
      order: count,
      isPrimary: count === 0, // first photo auto becomes primary
    },
  });

  res.status(201).json({
    id: photo.id,
    url: photo.url,
    order: photo.order,
    isPrimary: photo.isPrimary,
  });
}

export async function deletePhoto(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  const photo = await prisma.photo.findFirst({ where: { id, userId } });
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found', code: 'NOT_FOUND' });
  }

  // Remove from Supabase Storage
  if (supabase) {
    // Extract the path after /object/public/<bucket>/
    const marker = `/object/public/${BUCKET}/`;
    const idx = photo.url.indexOf(marker);
    if (idx !== -1) {
      const storagePath = photo.url.slice(idx + marker.length);
      await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
    }
  }

  await prisma.photo.delete({ where: { id } });

  // If it was primary, promote the next photo
  if (photo.isPrimary) {
    const next = await prisma.photo.findFirst({
      where: { userId },
      orderBy: { order: 'asc' },
    });
    if (next) {
      await prisma.photo.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  res.json({ ok: true });
}

export async function setPrimaryPhoto(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  const photo = await prisma.photo.findFirst({ where: { id, userId } });
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found', code: 'NOT_FOUND' });
  }

  await prisma.photo.updateMany({
    where: { userId },
    data: { isPrimary: false },
  });
  await prisma.photo.update({
    where: { id },
    data: { isPrimary: true },
  });

  res.json({ ok: true });
}

export async function reorderPhotos(req, res) {
  const userId = req.user.id;
  const { ids } = req.body || {};

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array required', code: 'VALIDATION_FAILED' });
  }

  // Verify all photos belong to this user
  const photos = await prisma.photo.findMany({ where: { userId } });
  const ownedIds = new Set(photos.map((p) => p.id));
  for (const id of ids) {
    if (!ownedIds.has(id)) {
      return res.status(403).json({ error: 'Not your photo', code: 'FORBIDDEN' });
    }
  }

  await Promise.all(
    ids.map((id, index) =>
      prisma.photo.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  res.json({ ok: true });
}
