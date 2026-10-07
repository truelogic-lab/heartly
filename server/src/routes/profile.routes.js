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

    // Ensure the profile exists first (creates a minimal one if missing)
    await engine.services.profile.ensureProfile(userId, {});

    // Then apply the patch
    const updated = await engine.services.profile.update(userId, patch);
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
