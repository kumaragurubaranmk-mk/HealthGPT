import { Router } from 'express';
import { MedicationsController } from '../controllers/medicationsController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateUser);

router.get('/', MedicationsController.getReminders);
router.post('/', MedicationsController.createReminder);
router.put('/:id', MedicationsController.updateReminder);
router.delete('/:id', MedicationsController.deleteReminder);

// Consumption Event (Requirement 4)
router.post('/consumption-event', MedicationsController.recordConsumptionEvent);
router.post('/:id/consumption-event', MedicationsController.recordConsumptionEvent);

// Patient Refusal (Requirement 6)
router.post('/refuse', MedicationsController.refuseMedicine);
router.post('/:id/refuse', MedicationsController.refuseMedicine);

// Escalation (Requirement 7 & 8)
router.post('/escalate', MedicationsController.escalateMedicine);
router.post('/:id/escalate', MedicationsController.escalateMedicine);

// Call Status updates
router.post('/calls/:callId/status', MedicationsController.updateCallStatus);
router.post('/:id/call-status', MedicationsController.updateCallStatus);

// Alert History (Requirement 11)
router.get('/alerts/history', MedicationsController.getAlertHistory);

// Manual verification attack honeypot / rejection (Requirement 1 & TEST 2)
router.post('/verify', MedicationsController.verifyMedicine);
router.post('/:id/verify', MedicationsController.verifyMedicine);
router.post('/log', MedicationsController.logStatus);

// CareConnect video verification session
router.post('/careconnect', MedicationsController.careConnectSession);
router.post('/:id/demo-call', MedicationsController.triggerDemoCall);

export default router;
