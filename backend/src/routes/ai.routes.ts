import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as AIController from '../controllers/ai.controller.js';

const router = Router();

router.use(authenticate);

router.post('/query', AIController.queryDocuments);
router.post('/generate-quiz', AIController.generateQuiz);
router.post('/explain', AIController.explainTopic);

export default router;
