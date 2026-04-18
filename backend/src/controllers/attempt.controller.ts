import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../config/db.js';

export const submitAttempt = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { quizId, answers } = req.body; // answers is an object { questionId: "Selected Option" }
    const userId = req.user!.userId;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    let score = 0;
    quiz.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const attempt = await prisma.attempt.create({
      data: {
        quizId,
        userId,
        score: Math.round((score / quiz.questions.length) * 100),
      },
    });

    res.status(201).json(attempt);
  } catch (error) {
    next(error);
  }
};

export const getUserAttempts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const attempts = await prisma.attempt.findMany({
      where: { userId },
      include: { quiz: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(attempts);
  } catch (error) {
    next(error);
  }
};
