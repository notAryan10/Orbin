import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../config/db.js';
import * as AIService from '../services/ai.service.js';

export const queryDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { query, workspaceId, documentIds } = req.body;
    console.log(`🔍 AI Query Request: "${query}" in workspace ${workspaceId}`);
    const userId = req.user!.userId;

    if (!query || !workspaceId) {
      console.log(`⚠️ Missing query or workspaceId`);
      return res.status(400).json({ message: 'Query and workspaceId are required' });
    }

    const result = await AIService.queryContext(query, workspaceId, documentIds);
    console.log(`✅ AI Query Response sent for: "${query}"`);
    res.json(result);
  } catch (error: any) {
    console.error(`❌ AI Query Error:`, error.message);
    next(error);
  }
};

export const generateQuiz = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { workspaceId, documentIds, numQuestions } = req.body;
    const userId = req.user!.userId;

    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }

    const quizQuestions = await AIService.generateStudyQuiz(workspaceId, documentIds, numQuestions);

    // Create quiz in DB
    const quiz = await prisma.quiz.create({
      data: {
        title: `Quiz for workspace ${workspaceId}`,
        workspaceId,
        creatorId: userId,
        questions: {
          create: quizQuestions.map((q: any) => ({
            text: q.text,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
          })),
        },
      },
      include: { questions: true },
    });

    res.status(201).json(quiz);
  } catch (error) {
    next(error);
  }
};

export const explainTopic = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { topic, workspaceId, documentIds } = req.body;
    
    if (!topic || !workspaceId) {
      return res.status(400).json({ message: 'topic and workspaceId are required' });
    }

    const explanation = await AIService.explainConcept(topic, workspaceId, documentIds);
    res.json(explanation);
  } catch (error) {
    next(error);
  }
};
