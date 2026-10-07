import { Router } from 'express';
const router = Router();

router.post('/like/:userId', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const viewerId = req.body.viewerId || 'demo_user';
    const result = await engine.services.like.like(viewerId, req.params.userId);
    res.json(result);
  } catch (e) { next(e); }
});

router.post('/super-like/:userId', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const viewerId = req.body.viewerId || 'demo_user';
    const result = await engine.services.like.superLike(viewerId, req.params.userId);
    res.json(result);
  } catch (e) { next(e); }
});

router.post('/pass/:userId', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const viewerId = req.body.viewerId || 'demo_user';
    await engine.services.like.pass(viewerId, req.params.userId);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/likes/received', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const userId = req.query.userId || 'demo_user';
    const items = await engine.services.like.likesReceived(userId);
    res.json({ items });
  } catch (e) { next(e); }
});

router.get('/likes/sent', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const userId = req.query.userId || 'demo_user';
    const items = await engine.services.like.likesSent(userId);
    res.json({ items });
  } catch (e) { next(e); }
});

export default router;
