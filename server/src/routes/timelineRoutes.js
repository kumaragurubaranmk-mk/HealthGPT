import { Router } from 'express';
import { TimelineController } from '../controllers/timelineController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateUser);

router.get('/', TimelineController.getTimeline);
router.post('/', TimelineController.addEvent);

export default router;
