import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../types';

export async function getMapData(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId, latField, lngField, labelField, valueField } = req.query;
    if (!sheetId || !latField || !lngField) return res.status(400).json({ error: 'sheetId, latField, lngField required' });

    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId as string }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType }));
    const data = await dynamicService.getAllData(sheet.tableName, fields);

    const features = data
      .filter((row: any) => row[latField as string] && row[lngField as string])
      .map((row: any) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [parseFloat(row[lngField as string]), parseFloat(row[latField as string])] },
        properties: {
          label: labelField ? row[labelField as string] : '',
          value: valueField ? parseFloat(row[valueField as string]) || 0 : 0,
          ...row,
        },
      }));

    res.json({
      type: 'FeatureCollection',
      features,
    });
  } catch (error) { next(error); }
}

export async function getRegionData(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sheets = await prisma.sheet.findMany({ include: { columns: true } });

    const regionData: Record<string, { count: number; total: number }> = {};

    for (const sheet of sheets) {
      const hasRegion = sheet.columns.find((c) => /region|wilaya|moughataa|commune|village/i.test(c.name));
      const hasAmount = sheet.columns.find((c) => /montant|amount|valeur|value|prix/i.test(c.name));

      if (hasRegion) {
        try {
          const dynamicService = await import('../services/dynamicTable');
          const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType }));
          const data = await dynamicService.getAggregatedData(
            sheet.tableName, fields, hasRegion.name, 'sum', hasAmount?.name
          );
          for (const item of data) {
            if (!regionData[item.key]) regionData[item.key] = { count: 0, total: 0 };
            regionData[item.key].count += item.count;
            regionData[item.key].total += item.value || 0;
          }
        } catch {
          // skip
        }
      }
    }

    res.json(regionData);
  } catch (error) { next(error); }
}
