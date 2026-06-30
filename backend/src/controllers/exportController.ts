import { Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { stringify } from 'csv-stringify/sync';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { createAuditLog } from '../utils/audit';

export async function exportExcel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId } = req.params;
    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType }));
    const data = await dynamicService.getAllData(sheet.tableName, fields);

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet(sheet.name);
    ws.columns = fields.map((f) => ({ header: f.name, key: f.name, width: 20 }));
    data.forEach((row) => ws.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${sheet.name}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();

    await createAuditLog({ userId: req.user!.userId, action: 'EXPORT', entity: 'sheet', entityId: sheetId, details: { format: 'excel' }, ip: req.ip });
  } catch (error) { next(error); }
}

export async function exportCSV(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId } = req.params;
    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType }));
    const data = await dynamicService.getAllData(sheet.tableName, fields);

    const csv = stringify(data, { header: true, columns: fields.map((f) => f.name) });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${sheet.name}.csv`);
    res.send(csv);

    await createAuditLog({ userId: req.user!.userId, action: 'EXPORT', entity: 'sheet', entityId: sheetId, details: { format: 'csv' }, ip: req.ip });
  } catch (error) { next(error); }
}

export async function exportPDF(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId } = req.params;
    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId }, include: { columns: true } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType }));
    const data = await dynamicService.getAllData(sheet.tableName, fields);

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: data.length > 20 ? 'landscape' : 'portrait' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${sheet.name}.pdf`);
    doc.pipe(res);

    doc.fontSize(16).text(sheet.name, { align: 'center' }).moveDown();
    doc.fontSize(8);

    const headers = fields.map((f) => f.name);
    const colWidth = Math.min(150, Math.floor((doc.page.width - 60) / headers.length));

    const drawTable = () => {
      let y = doc.y;
      headers.forEach((h, i) => doc.text(h, 30 + i * colWidth, y, { width: colWidth, bold: true }));
      y += 15;
      data.forEach((row) => {
        if (y > doc.page.height - 40) { doc.addPage(); y = 30; }
        headers.forEach((h, i) => doc.text(String(row[h] ?? ''), 30 + i * colWidth, y, { width: colWidth }));
        y += 12;
      });
    };

    drawTable();
    doc.end();

    await createAuditLog({ userId: req.user!.userId, action: 'EXPORT', entity: 'sheet', entityId: sheetId, details: { format: 'pdf' }, ip: req.ip });
  } catch (error) { next(error); }
}

export async function exportJSON(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sheetId } = req.params;
    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId } });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const dynamicService = await import('../services/dynamicTable');
    const fields = (await prisma.column.findMany({ where: { sheetId }, orderBy: { position: 'asc' } })).map((c) => ({ name: c.name, type: c.dataType }));
    const data = await dynamicService.getAllData(sheet.tableName, fields);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${sheet.name}.json`);
    res.json(data);

    await createAuditLog({ userId: req.user!.userId, action: 'EXPORT', entity: 'sheet', entityId: sheetId, details: { format: 'json' }, ip: req.ip });
  } catch (error) { next(error); }
}
