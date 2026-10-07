import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listNotifications, unreadCount,
} from '../controllers/notifications.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', listNotifications);
router.get('/count', unreadCount);

export default router;
