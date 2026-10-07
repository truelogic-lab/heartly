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
