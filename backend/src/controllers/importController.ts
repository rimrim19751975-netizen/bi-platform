import { Response, NextFunction } from 'express';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { prisma } from '../index';
import { AuthRequest, ImportResult } from '../types';
import { importExcel } from '../services/importer';
import { createAuditLog } from '../utils/audit';

export async function importFile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName).toLowerCase();

    const result: ImportResult = await importExcel(filePath, originalName, req.user!.userId);

    await createAuditLog({
      userId: req.user!.userId,
      action: 'IMPORT',
      entity: 'file',
      entityId: result.fileId,
      details: { fileName: originalName, sheets: result.sheets.length, rows: result.sheets.reduce((a, s) => a + s.rowCount, 0) },
      ip: req.ip,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listFiles(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      prisma.importedFile.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { sheets: { include: { _count: { select: { columns: true } } } } },
        where: req.user!.role === 'SUPER_ADMIN' ? {} : { userId: req.user!.userId },
      }),
      prisma.importedFile.count({
        where: req.user!.role === 'SUPER_ADMIN' ? {} : { userId: req.user!.userId },
      }),
    ]);

    res.json({ data: files, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function getFile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const file = await prisma.importedFile.findUnique({
      where: { id: req.params.id },
      include: { sheets: { include: { columns: { orderBy: { position: 'asc' } } } } },
    });
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (error) {
    next(error);
  }
}

export async function deleteFile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const file = await prisma.importedFile.findUnique({
      where: { id: req.params.id },
      include: { sheets: true },
    });
    if (!file) return res.status(404).json({ error: 'File not found' });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE_FILE',
      entity: 'file',
      entityId: file.id,
      details: { fileName: file.originalName },
      ip: req.ip,
    });

    await prisma.importedFile.delete({ where: { id: req.params.id } });
    res.json({ message: 'File deleted' });
  } catch (error) {
    next(error);
  }
}

export async function getSheet(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sheet = await prisma.sheet.findUnique({
      where: { id: req.params.id },
      include: { columns: { orderBy: { position: 'asc' } } },
    });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const tableName = sheet.tableName;
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType, nullable: true, isPrimary: false }));

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const sortField = req.query.sortField as string;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';
    const search = req.query.search as string;
    const filters = req.query.filters ? JSON.parse(req.query.filters as string) : undefined;

    const result = await dynamicService.getPaginatedData(tableName, fields, { page, limit, sortField, sortOrder, search, filters });

    res.json({ sheet, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getSheetColumns(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sheet = await prisma.sheet.findUnique({
      where: { id: req.params.id },
      include: { columns: { orderBy: { position: 'asc' } } },
    });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });
    res.json(sheet.columns);
  } catch (error) {
    next(error);
  }
}
