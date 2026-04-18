import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../config/db.js';

export const createWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const userId = req.user!.userId;

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        ownerId: userId,
      },
    });

    res.status(201).json(workspace);
  } catch (error) {
    next(error);
  }
};

export const getUserWorkspaces = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const workspaces = await prisma.workspace.findMany({
      where: { ownerId: userId },
    });
    res.json(workspaces);
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: id as string,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        documents: true,
        quizzes: true,
        members: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    res.json(workspace);
  } catch (error) {
    next(error);
  }
};

export const shareWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    const userId = req.user!.userId;

    // Check if user is owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: id as string },
    });

    if (!workspace || workspace.ownerId !== userId) {
      return res.status(403).json({ message: 'Only the owner can share the workspace' });
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'User to share with not found' });
    }

    // Create member entry
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: id as string,
        userId: targetUser.id,
        role: role || 'viewer',
      },
    });

    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
};

export const getSharedWorkspaces = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const sharedMemberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });

    const workspaces = sharedMemberships.map(m => m.workspace);
    res.json(workspaces);
  } catch (error) {
    next(error);
  }
};
