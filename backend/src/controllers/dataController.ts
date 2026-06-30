import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { createAuditLog } from '../utils/audit';

export async function createRecord(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId } = req.params;
    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType, nullable: true, isPrimary: false }));
    const record = await dynamicService.createRecord(sheet.tableName, fields, req.body.data);

    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      entity: 'record',
      entityId: `${sheet.tableName}:${JSON.stringify(record)}`,
      details: { sheetId, sheetName: sheet.name, data: req.body.data },
      ip: req.ip,
    });

    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

export async function updateRecord(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId, id } = req.params;
    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType, nullable: true, isPrimary: false }));
    const record = await dynamicService.updateRecord(sheet.tableName, fields, id, req.body.data);

    await createAuditLog({
      userId: req.user!.userId,
      action: 'UPDATE',
      entity: 'record',
      entityId: `${sheet.tableName}:${id}`,
      details: { sheetId, sheetName: sheet.name, data: req.body.data },
      ip: req.ip,
    });

    res.json(record);
  } catch (error) {
    next(error);
  }
}

export async function deleteRecord(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId, id } = req.params;
    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType, nullable: true, isPrimary: false }));
    await dynamicService.deleteRecord(sheet.tableName, fields, id);

    await createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE',
      entity: 'record',
      entityId: `${sheet.tableName}:${id}`,
      details: { sheetId, sheetName: sheet.name },
      ip: req.ip,
    });

    res.json({ message: 'Record deleted' });
  } catch (error) {
    next(error);
  }
}

export async function getRecord(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId, id } = req.params;
    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType, nullable: true, isPrimary: false }));
    const record = await dynamicService.getRecord(sheet.tableName, fields, id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    res.json(record);
  } catch (error) {
    next(error);
  }
}

export async function duplicateRecord(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId, id } = req.params;
    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType, nullable: true, isPrimary: false }));
    const record = await dynamicService.duplicateRecord(sheet.tableName, fields, id);

    await createAuditLog({
      userId: req.user!.userId,
      action: 'DUPLICATE',
      entity: 'record',
      entityId: `${sheet.tableName}:${id}`,
      details: { sheetId, sheetName: sheet.name },
      ip: req.ip,
    });

    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId } = req.params;
    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType, nullable: true, isPrimary: false }));
    const stats = await dynamicService.getStats(sheet.tableName, fields);

    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function bulkDelete(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId } = req.params;
    const { ids } = req.body;
    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType, nullable: true, isPrimary: false }));
    await dynamicService.bulkDelete(sheet.tableName, fields, ids);

    await createAuditLog({
      userId: req.user!.userId,
      action: 'BULK_DELETE',
      entity: 'record',
      details: { sheetId, sheetName: sheet.name, count: ids.length },
      ip: req.ip,
    });

    res.json({ message: `${ids.length} records deleted` });
  } catch (error) {
    next(error);
  }
}
