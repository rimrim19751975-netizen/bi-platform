import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../types';

export async function globalSearch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) || '';
    if (!q || q.length < 2) return res.json({ results: [] });

    const sheets = await prisma.sheet.findMany({ include: { columns: true } });
    const results: { sheetId: string; sheetName: string; tableName: string; records: any[] }[] = [];

    const dynamicService = await import('../services/dynamicTable');

    for (const sheet of sheets.slice(0, 10)) {
      try {
        const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType }));
        const records = await dynamicService.search(sheet.tableName, fields, q);
        if (records.length > 0) {
          results.push({ sheetId: sheet.id, sheetName: sheet.name, tableName: sheet.tableName, records: records.slice(0, 5) });
        }
      } catch {
        // skip tables that error
      }
    }

    res.json({ query: q, results, totalResults: results.reduce((a, r) => a + r.records.length, 0) });
  } catch (error) { next(error); }
}

export async function advancedSearch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { field, operator, value, sheetId } = req.body;
    if (!field || !operator || !sheetId) return res.status(400).json({ error: 'field, operator, value, sheetId required' });

    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType }));
    const results = await dynamicService.advancedSearch(sheet.tableName, fields, { field, operator, value });

    res.json({ results, count: results.length });
  } catch (error) { next(error); }
}
