import { Router } from 'express';
import { GuardianController } from '../controllers/guardianController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateUser);

router.get('/', GuardianController.getGuardians);
router.post('/', GuardianController.addGuardian);
router.put('/:id', GuardianController.updateGuardian);
router.delete('/:id', GuardianController.deleteGuardian);
router.post('/alerts/send-demo', GuardianController.sendDemoAlert);

export default router;
