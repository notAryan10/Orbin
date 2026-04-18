import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as AttemptController from '../controllers/attempt.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', AttemptController.submitAttempt);
router.get('/user', AttemptController.getUserAttempts);

export default router;
