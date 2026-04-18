import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../config/db.js';
import fs from 'fs';
import { processDocument } from '../services/ingestion.service.js';

export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('📥 Upload request received:', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        path: req.file.path,
        size: req.file.size
      } : 'No file'
    });

    const { title, workspaceId } = req.body;
    const file = req.file;
    const userId = req.user!.userId;

    if (!file) {
      console.warn('⚠️ No file attached to the request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = await prisma.document.create({
      data: {
        title: title || file.originalname,
        filePath: file.path,
        fileType: file.mimetype,
        workspaceId,
        ownerId: userId,
        status: 'PENDING',
      },
    });

    // Trigger background processing (asynchronously)
    processDocument(document.id);

    res.status(201).json({
      message: 'Document uploaded and queued for processing',
      document,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const document = await prisma.document.findFirst({
      where: { id: id as string, ownerId: userId },
      include: { chunks: true },
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.userId;

    const documents = await prisma.document.findMany({
      where: { workspaceId: workspaceId as string, ownerId: userId },
    });

    res.json(documents);
  } catch (error) {
    next(error);
  }
};
