import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import * as DocumentController from '../controllers/document.controller.js';
import path from 'path';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticate);

router.post('/upload', upload.single('file'), DocumentController.uploadDocument);
router.get('/:id', DocumentController.getDocument);
router.get('/workspace/:workspaceId', DocumentController.getWorkspaceDocuments);

export default router;
