import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/resend-otp', AuthController.resendOtp);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', authenticateUser, AuthController.me);

export default router;
