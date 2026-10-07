import { Router } from 'express';
const router = Router();

router.get('/discover', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const userId = req.query.userId || 'demo_user';
    const limit = Number(req.query.limit) || 40;
    const items = await engine.services.discovery.feedFor(userId, { limit });
    res.json({ items, total: items.length });
  } catch (e) { next(e); }
});

router.get('/daily-picks', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const userId = req.query.userId || 'demo_user';
    const day = req.query.day || new Date().toISOString().slice(0, 10);
    const count = Number(req.query.count) || 4;
    const items = await engine.services.recommendation.dailyPicks(userId, day, count);
    res.json({ items });
  } catch (e) { next(e); }
});

router.get('/online-now', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const userId = req.query.userId || 'demo_user';
    const count = Number(req.query.count) || 6;
    const items = await engine.services.recommendation.onlineNow(userId, count);
    res.json({ items });
  } catch (e) { next(e); }
});

router.get('/by-interest', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const userId = req.query.userId || 'demo_user';
    const count = Number(req.query.count) || 6;
    const items = await engine.services.recommendation.bySharedInterests(userId, count);
    res.json({ items });
  } catch (e) { next(e); }
});

export default router;
