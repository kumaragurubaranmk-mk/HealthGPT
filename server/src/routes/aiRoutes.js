import { Router } from 'express';
import { AIController } from '../controllers/aiController.js';
import { authenticateUser, optionalAuthUser } from '../middleware/authMiddleware.js';

const router = Router();

// Public / Demo-compatible chat endpoint with optional authentication
router.post('/chat', optionalAuthUser, AIController.quickChat);
router.get('/config', optionalAuthUser, AIController.getConfig);
router.post('/config', optionalAuthUser, AIController.setConfig);

// Authenticated conversation management
router.use(authenticateUser);

router.get('/conversations', AIController.getConversations);
router.post('/conversations', AIController.createConversation);
router.get('/conversations/:conversationId/messages', AIController.getConversationMessages);
router.post('/conversations/:conversationId/messages', AIController.sendMessage);
router.post('/conversations/:conversationId/clear', AIController.clearConversation);
router.delete('/conversations/:conversationId', AIController.deleteConversation);

export default router;
