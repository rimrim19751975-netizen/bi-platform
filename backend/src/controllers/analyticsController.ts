import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../types';

export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [fileCount, sheetCount, userCount] = await Promise.all([
      prisma.importedFile.count(),
      prisma.sheet.count(),
      prisma.user.count(),
    ]);

    const sheets = await prisma.sheet.findMany();
    let totalRecords = 0;
    for (const sheet of sheets) {
      try {
        const dynamicService = await import('../services/dynamicTable');
        const count = await dynamicService.getRowCount(sheet.tableName);
        totalRecords += count;
      } catch {
        // table might not exist
      }
    }

    res.json({
      fileCount,
      sheetCount,
      totalRecords,
      userCount,
    });
  } catch (error) {
    next(error);
  }
}

export async function getChartData(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId, field, chartType } = req.query;
    if (!sheetId || !field) return res.status(400).json({ error: 'sheetId and field required' });

    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId as string }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType }));
    const data = await dynamicService.getChartData(sheet.tableName, fields, field as string, (chartType as string) || 'bar');

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getAdvancedAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId, groupBy, aggregate, aggField } = req.query;
    if (!sheetId || !groupBy) return res.status(400).json({ error: 'sheetId and groupBy required' });

    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId as string }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType }));
    const data = await dynamicService.getAggregatedData(
      sheet.tableName, fields, groupBy as string,
      (aggregate as string) || 'count', aggField as string
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getTimeSeries(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId, dateField, valueField, interval } = req.query;
    if (!sheetId || !dateField) return res.status(400).json({ error: 'sheetId and dateField required' });

    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId as string }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType }));
    const data = await dynamicService.getTimeSeries(
      sheet.tableName, fields, dateField as string,
      valueField as string, (interval as string) || 'month'
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
}
