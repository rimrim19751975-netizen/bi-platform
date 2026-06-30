import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { createAuditLog } from '../utils/audit';
import { AppError } from '../middlewares/errorHandler';

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) { next(error); }
}

export async function createUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(400, 'Email already exists');

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, firstName, lastName, role },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    });

    await createAuditLog({ userId: req.user!.userId, action: 'CREATE_USER', entity: 'user', entityId: user.id, details: { email }, ip: req.ip });

    res.status(201).json(user);
  } catch (error) { next(error); }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { firstName, lastName, role, isActive } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { firstName, lastName, role, isActive },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    });

    await createAuditLog({ userId: req.user!.userId, action: 'UPDATE_USER', entity: 'user', entityId: user.id, details: req.body, ip: req.ip });

    res.json(user);
  } catch (error) { next(error); }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.params.id === req.user!.userId) throw new AppError(400, 'Cannot delete yourself');
    await prisma.user.delete({ where: { id: req.params.id } });

    await createAuditLog({ userId: req.user!.userId, action: 'DELETE_USER', entity: 'user', entityId: req.params.id, ip: req.ip });

    res.json({ message: 'User deleted' });
  } catch (error) { next(error); }
}

export async function getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      prisma.auditLog.count(),
    ]);

    res.json({ data: logs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
}

export async function getSystemStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [userCount, fileCount, sheetCount, logCount] = await Promise.all([
      prisma.user.count(),
      prisma.importedFile.count(),
      prisma.sheet.count(),
      prisma.auditLog.count(),
    ]);

    res.json({ userCount, fileCount, sheetCount, logCount });
  } catch (error) { next(error); }
}
