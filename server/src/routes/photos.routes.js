import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import {
  uploadPhoto, deletePhoto, setPrimaryPhoto, reorderPhotos,
} from '../controllers/upload.controller.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported image type'));
  },
});

router.post('/', requireAuth, upload.single('file'), uploadPhoto);
router.delete('/:id', requireAuth, deletePhoto);
router.put('/:id/primary', requireAuth, setPrimaryPhoto);
router.put('/reorder', requireAuth, reorderPhotos);

export default router;
