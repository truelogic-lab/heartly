import { Router } from 'express';
const router = Router();

router.post('/block/:userId', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const viewerId = req.body.viewerId || 'demo_user';
    const rec = await engine.services.safety.block(viewerId, req.params.userId);
    res.status(201).json(rec);
  } catch (e) { next(e); }
});

router.post('/unblock/:userId', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const viewerId = req.body.viewerId || 'demo_user';
    await engine.services.safety.unblock(viewerId, req.params.userId);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/report/:userId', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const viewerId = req.body.viewerId || 'demo_user';
    const rec = await engine.services.safety.report(viewerId, req.params.userId, req.body.reason);
    res.status(201).json(rec);
  } catch (e) { next(e); }
});

export default router;
