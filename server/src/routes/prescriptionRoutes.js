import { Router } from 'express';
import { PrescriptionController } from '../controllers/prescriptionController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateUser);

router.post('/extract', PrescriptionController.extractPrescription);
router.get('/samples', PrescriptionController.getSamples);
router.post('/', PrescriptionController.savePrescription);
router.get('/', PrescriptionController.getPrescriptions);
router.get('/:id', PrescriptionController.getPrescriptionById);
router.delete('/:id', PrescriptionController.deletePrescription);

export default router;
