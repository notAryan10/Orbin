import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as WorkspaceController from '../controllers/workspace.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', WorkspaceController.createWorkspace);
router.get('/', WorkspaceController.getUserWorkspaces);
router.get('/shared', WorkspaceController.getSharedWorkspaces);
router.post('/:id/share', WorkspaceController.shareWorkspace);
router.get('/:id', WorkspaceController.getWorkspaceById);

export default router;
