import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';
import documentRoutes from './routes/document.routes.js';
import aiRoutes from './routes/ai.routes.js';
import attemptRoutes from './routes/attempt.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/attempts', attemptRoutes);

// Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 AI Study Workspace Server running on http://localhost:${PORT}`);
  
  // Re-process any documents that were stuck in PENDING or PROCESSING on startup
  const { reprocessPendingDocuments } = await import('./services/ingestion.service.js');
  reprocessPendingDocuments();
});
