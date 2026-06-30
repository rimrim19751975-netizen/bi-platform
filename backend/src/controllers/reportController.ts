import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { createAuditLog } from '../utils/audit';

export async function createReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await prisma.report.create({
      data: { ...req.body, userId: req.user!.userId },
    });
    res.status(201).json(report);
  } catch (error) { next(error); }
}

export async function listReports(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reports);
  } catch (error) { next(error); }
}

export async function getReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (error) { next(error); }
}

export async function updateReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(report);
  } catch (error) { next(error); }
}

export async function deleteReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.report.delete({ where: { id: req.params.id } });
    res.json({ message: 'Report deleted' });
  } catch (error) { next(error); }
}

export async function generateReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const reportService = await import('../services/reportGenerator');
    const pdfBuffer = await reportService.generatePDFReport(report.config as any);

    await prisma.report.update({ where: { id: report.id }, data: { lastRunAt: new Date() } });

    await createAuditLog({ userId: req.user!.userId, action: 'GENERATE_REPORT', entity: 'report', entityId: report.id, ip: req.ip });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${report.name}.pdf`);
    res.send(pdfBuffer);
  } catch (error) { next(error); }
}
