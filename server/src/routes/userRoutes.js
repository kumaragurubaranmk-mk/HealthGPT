import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateUser);

router.get('/profile', UserController.getUserProfile);
router.put('/profile', UserController.updateUserProfile);
router.get('/health-profile', UserController.getHealthProfile);
router.put('/health-profile', UserController.updateHealthProfile);
router.get('/export-data', UserController.exportUserData);
router.delete('/delete-account', UserController.deleteAccount);
router.post('/language', UserController.updateLanguage);
router.put('/language', UserController.updateLanguage);

export default router;
