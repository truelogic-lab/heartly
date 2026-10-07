import { Router } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import discoveryRoutes from './discovery.routes.js';
import likeRoutes from './like.routes.js';
import matchRoutes from './match.routes.js';
import chatRoutes from './chat.routes.js';
import safetyRoutes from './safety.routes.js';
import uploadRoutes from './upload.routes.js';
import photosRoutes from './photos.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/profile/photos', photosRoutes);
router.use('/upload', uploadRoutes);
router.use('/', discoveryRoutes);
router.use('/', likeRoutes);
router.use('/matches', matchRoutes);
router.use('/chat', chatRoutes);
router.use('/safety', safetyRoutes);

export default router;
