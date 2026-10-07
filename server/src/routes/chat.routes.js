import { Router } from 'express';
const router = Router();

router.get('/:matchId', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const viewerId = req.query.userId || 'demo_user';
    const conv = await engine.services.message.getConversation(req.params.matchId, viewerId);
    res.json(conv);
  } catch (e) { next(e); }
});

router.post('/:matchId', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const senderId = req.body.senderId || 'demo_user';
    const msg = await engine.services.message.send(req.params.matchId, senderId, req.body.body);
    res.status(201).json(msg);
  } catch (e) { next(e); }
});

router.post('/:matchId/read', async (req, res, next) => {
  try {
    const engine = req.app.locals.engine;
    const readerId = req.body.readerId || 'demo_user';
    const updated = await engine.services.message.markRead(req.params.matchId, readerId);
    res.json({ updated });
  } catch (e) { next(e); }
});

export default router;
