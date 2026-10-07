import { Router } from 'express';
import { SosController } from '../controllers/sosController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateUser);

router.post('/trigger', SosController.triggerSos);
router.get('/history', SosController.getHistory);

export default router;
