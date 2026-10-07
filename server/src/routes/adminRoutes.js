import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticateAdmin } from '../middleware/adminMiddleware.js';

const router = Router();

// Public Admin Auth
router.post('/login', AdminController.login);

// Protected Admin Operations
router.use(authenticateAdmin);

router.get('/dashboard', AdminController.getDashboardStats);

// User Operational Management (Strictly privacy compliant, NO private health records accessed)
router.get('/users', AdminController.getUsers);
router.patch('/users/:id/status', AdminController.updateUserStatus);

// Educational Articles Management
router.get('/articles', AdminController.getArticles);
router.post('/articles', AdminController.createArticle);
router.put('/articles/:id', AdminController.updateArticle);
router.delete('/articles/:id', AdminController.deleteArticle);

// Medical Dictionary Management
router.post('/dictionary', AdminController.createDictionaryTerm);
router.put('/dictionary/:id', AdminController.updateDictionaryTerm);
router.delete('/dictionary/:id', AdminController.deleteDictionaryTerm);

// Security & Audit Logs
router.get('/audit-logs', AdminController.getAuditLogs);

// Feedback Management
router.get('/feedback', AdminController.getFeedback);
router.patch('/feedback/:id', AdminController.updateFeedbackStatus);

// Medicines & Schedules Management
router.get('/medicines', AdminController.getAllMedicines);
router.post('/medicines', AdminController.createMedicineAdmin);
router.put('/medicines/:id', AdminController.updateMedicineAdmin);
router.delete('/medicines/:id', AdminController.deleteMedicineAdmin);

// Guardians Management
router.get('/guardians', AdminController.getAllGuardians);
router.put('/guardians/:id', AdminController.updateGuardianAdmin);
router.delete('/guardians/:id', AdminController.deleteGuardianAdmin);

// Health Reports & Prescriptions
router.get('/reports', AdminController.getAllReportsAdmin);
router.delete('/reports/:id', AdminController.deleteReportAdmin);

// Alert & Escalation History
router.get('/alerts', AdminController.getAllAlertsAdmin);

// System Settings & Configuration (Website, Health Tracker, CareConnect, Languages)
router.get('/settings', AdminController.getSettingsAdmin);
router.post('/settings', AdminController.updateSettingsAdmin);
router.put('/settings', AdminController.updateSettingsAdmin);

// AI & System Configuration
router.post('/ai-config', AdminController.updateAiConfig);

export default router;
