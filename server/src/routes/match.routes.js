import { Router } from 'express';
const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const userId = req.query.userId || 'demo_user';
    const items = await engine.services.match.listForUser(userId);
    res.json({ items });
  } catch (e) { next(e); }
});

router.get('/:matchId', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const userId = req.query.userId || 'demo_user';
    const detail = await engine.services.match.detail(req.params.matchId, userId);
    res.json(detail);
  } catch (e) { next(e); }
});

export default router;
