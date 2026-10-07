import { Router } from 'express';
const router = Router();

router.get('/me', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const userId = req.query.userId || 'demo_user';
    const profile = await engine.services.profile.getEnriched(userId);
    res.json(profile);
  } catch (e) { next(e); }
});

router.put('/me', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const userId = req.body.userId || 'demo_user';
    const updated = await engine.services.profile.update(userId, req.body);
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
