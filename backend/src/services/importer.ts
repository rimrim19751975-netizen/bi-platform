import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { prisma } from '../index';
import { ImportResult, ColumnInfo } from '../types';
import { sanitizeTableName, detectDataType } from '../utils/helpers';
import { logger } from '../utils/logger';
import { createDynamicTable, insertData } from './dynamicTable';

function readCSV(filePath: string): { sheets: { name: string; headers: string[]; rows: any[][] }[] } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });
  const headers = Object.keys(records[0] || {});
  const rows = records.map((r: any) => headers.map((h) => r[h]));
  return { sheets: [{ name: 'Sheet1', headers, rows }] };
}

function readODS(filePath: string): { sheets: { name: string; headers: string[]; rows: any[][] }[] } {
  const workbook = XLSX.readFile(filePath, { type: 'file' });
  const sheets: { name: string; headers: string[]; rows: any[][] }[] = [];
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    if (data.length < 2) continue;
    const headers = (data[0] || []).map((h: any) => String(h).trim());
    const rows = data.slice(1).filter((row: any[]) => row.some((cell: any) => cell !== undefined && cell !== null && cell !== ''));
    sheets.push({ name: sheetName, headers, rows });
  }
  return { sheets };
}

function detectColumnTypes(headers: string[], rows: any[][]): ColumnInfo[] {
  return headers.map((name, idx) => {
    const sampleValues = rows.slice(0, 100).map((r) => r[idx]).filter((v) => v !== undefined && v !== null && v !== '');
    const typeCounts: Record<string, number> = {};
    sampleValues.forEach((v) => {
      const t = detectDataType(v);
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    let bestType = 'text';
    let bestCount = 0;
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > bestCount) { bestCount = count; bestType = type; }
    }
    return { name: sanitizeTableName(name), type: bestType, nullable: true, isPrimary: false };
  });
}

export async function importExcel(filePath: string, originalName: string, userId: string): Promise<ImportResult> {
  const ext = path.extname(originalName).toLowerCase();
  let fileData: { sheets: { name: string; headers: string[]; rows: any[][] }[] };

  if (ext === '.csv') {
    fileData = readCSV(filePath);
  } else if (ext === '.ods') {
    fileData = readODS(filePath);
  } else {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    fileData = { sheets: [] };
    workbook.eachSheet((ws) => {
      const rows: any[][] = [];
      const headers: string[] = [];
      ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const values = row.values as any[];
        values.shift();
        if (rowNumber === 1) {
          headers.push(...values.map((v) => String(v ?? `Column_${values.indexOf(v) + 1}`).trim()));
        } else {
          if (values.some((v) => v !== undefined && v !== null && v !== '')) {
            rows.push(values);
          }
        }
      });
      if (headers.length > 0) {
        fileData.sheets.push({ name: ws.name, headers, rows });
      }
    });
  }

  const importedFile = await prisma.importedFile.create({
    data: {
      fileName: path.basename(filePath),
      originalName,
      fileType: ext,
      fileSize: fs.statSync(filePath).size,
      sheetCount: fileData.sheets.length,
      userId,
    },
  });

  const result: ImportResult = { fileId: importedFile.id, sheets: [] };

  for (const sheetData of fileData.sheets) {
    const tableName = `${sanitizeTableName(path.parse(originalName).name)}_${sanitizeTableName(sheetData.name)}`;
    const columns = detectColumnTypes(sheetData.headers, sheetData.rows);

    const sheet = await prisma.sheet.create({
      data: {
        fileId: importedFile.id,
        name: sheetData.name,
        tableName,
        rowCount: sheetData.rows.length,
        columnCount: columns.length,
        columns: {
          create: columns.map((col, idx) => ({
            name: col.name,
            originalName: sheetData.headers[idx],
            dataType: col.type,
            position: idx + 1,
            isNullable: col.nullable,
            isPrimary: col.isPrimary,
          })),
        },
      },
      include: { columns: true },
    });

    logger.info(`Creating dynamic table: ${tableName}`);
    await createDynamicTable(tableName, columns);

    if (sheetData.rows.length > 0) {
      const mappedRows = sheetData.rows.map((row) => {
        const obj: Record<string, any> = {};
        columns.forEach((col, idx) => {
          let val = row[idx];
          if (val !== undefined && val !== null) {
            if (col.type === 'date') val = new Date(val);
            else if (col.type === 'float') val = parseFloat(String(val).replace(',', '.'));
            else if (col.type === 'integer') val = parseInt(String(val));
            else if (col.type === 'boolean') val = /^(true|vrai|oui|yes|1)$/i.test(String(val));
            else val = String(val);
          }
          obj[col.name] = val ?? null;
        });
        return obj;
      });

      await insertData(tableName, columns, mappedRows);
    }

    result.sheets.push({
      name: sheetData.name,
      tableName,
      rowCount: sheetData.rows.length,
      columns: columns.map((c) => ({ name: c.name, type: c.type })),
    });
  }

  logger.info(`Import complete: ${originalName} - ${fileData.sheets.length} sheets, ${result.sheets.reduce((a, s) => a + s.rowCount, 0)} rows`);

  return result;
}
