import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../types';

export async function createDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dashboard = await prisma.dashboard.create({
      data: { ...req.body, userId: req.user!.userId },
    });
    res.status(201).json(dashboard);
  } catch (error) { next(error); }
}

export async function listDashboards(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dashboards = await prisma.dashboard.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(dashboards);
  } catch (error) { next(error); }
}

export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dashboard = await prisma.dashboard.findUnique({ where: { id: req.params.id } });
    if (!dashboard) return res.status(404).json({ error: 'Dashboard not found' });
    res.json(dashboard);
  } catch (error) { next(error); }
}

export async function updateDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dashboard = await prisma.dashboard.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(dashboard);
  } catch (error) { next(error); }
}

export async function deleteDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.dashboard.delete({ where: { id: req.params.id } });
    res.json({ message: 'Dashboard deleted' });
  } catch (error) { next(error); }
}

export async function getDefaultDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dashboard = await prisma.dashboard.findFirst({
      where: { userId: req.user!.userId, isDefault: true },
    });
    if (dashboard) return res.json(dashboard);

    const dynamicService = await import('../services/dynamicTable');
    const stats = await dynamicService.getGlobalStats();
    res.json({ stats, message: 'Auto-generated dashboard' });
  } catch (error) { next(error); }
}
