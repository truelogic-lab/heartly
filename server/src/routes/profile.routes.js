import { Router } from 'express';
const router = Router();

/* GET — read the current user's enriched profile */
router.get('/me', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const userId = req.query.userId || 'demo_user';
    const profile = await engine.services.profile.getEnriched(userId);
    res.json(profile);
  } catch (e) { next(e); }
});

/* PUT — create or update the profile (idempotent) */
router.put('/me', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const { userId = 'demo_user', ...patch } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required', code: 'VALIDATION_FAILED' });
    }

    // 1. Ensure the user row exists
    const existingUser = await engine.repositories.users.findById(userId);
    if (!existingUser) {
      await engine.repositories.users.createWithId({
        id: userId,
        email: patch.email || `${userId}@heartly.local`,
        name: patch.name || 'Anonymous',
      });
    }

    // 2. Ensure the profile exists
    await engine.services.profile.ensureProfile(userId, {});

    // 3. Apply the update
    const updated = await engine.services.profile.update(userId, patch);
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
