import { Router } from 'express';
import { MetricsController } from '../controllers/metricsController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateUser);

router.get('/', MetricsController.getMetrics);
router.post('/', MetricsController.addMetric);
router.delete('/:id', MetricsController.deleteMetric);
router.get('/summary', MetricsController.getDashboardSummary);

export default router;
