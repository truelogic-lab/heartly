import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register, login, refresh, logout, me,
  forgotPassword, resetPassword, deleteAccount,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, try again later', code: 'RATE_LIMITED' },
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reset attempts', code: 'RATE_LIMITED' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password', resetLimiter, resetPassword);
router.delete('/account', requireAuth, deleteAccount);

export default router;
