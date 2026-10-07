import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listBlocked, unblock, getVisibility, setVisibility, reportUser,
} from '../controllers/safety.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/blocked', listBlocked);
router.delete('/block/:userId', unblock);
router.get('/visibility', getVisibility);
router.put('/visibility', setVisibility);
router.post('/report/:userId', reportUser);

export default router;
