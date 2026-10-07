import { Router } from 'express';
import { RecordsController } from '../controllers/recordsController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateUser);

router.get('/', RecordsController.getRecords);
router.post('/', RecordsController.createRecord);
router.put('/:id', RecordsController.updateRecord);
router.delete('/:id', RecordsController.deleteRecord);

export default router;
