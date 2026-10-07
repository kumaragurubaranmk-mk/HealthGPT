import { Router } from 'express';
import { ReportController } from '../controllers/reportController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateUser);

router.post('/extract', ReportController.extractReport);
router.get('/samples', ReportController.getSamples);
router.get('/trends', ReportController.getHealthTrends);
router.post('/', ReportController.uploadReport);
router.get('/', ReportController.getReports);
router.get('/timeline', ReportController.getLifetimeTimeline);
router.get('/:id', ReportController.getReportById);
router.get('/:id/file', ReportController.getFile);
router.get('/:id/view', ReportController.viewReport);
router.get('/:id/compare', ReportController.compareReport);
router.delete('/:id', ReportController.deleteReport);

export default router;
