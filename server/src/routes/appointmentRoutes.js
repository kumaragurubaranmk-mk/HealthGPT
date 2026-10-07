import { Router } from 'express';
import { AppointmentsController } from '../controllers/appointmentsController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateUser);

router.get('/', AppointmentsController.getAppointments);
router.post('/', AppointmentsController.createAppointment);
router.put('/:id', AppointmentsController.updateAppointment);
router.delete('/:id', AppointmentsController.deleteAppointment);

export default router;
