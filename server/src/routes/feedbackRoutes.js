import { Router } from 'express';
import { FeedbackController } from '../controllers/feedbackController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

// Allow both anonymous & authenticated feedback submission
router.post('/', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticateUser(req, res, () => FeedbackController.submitFeedback(req, res, next));
  }
  return FeedbackController.submitFeedback(req, res, next);
});

router.get('/my', authenticateUser, FeedbackController.getMyFeedback);

export default router;
