import { prisma } from '../index';
import { ColumnInfo, PaginatedResult, PaginationParams, DataRow } from '../types';
import { paginate } from '../utils/helpers';
import { logger } from '../utils/logger';

function mapFieldType(type: string): string {
  const map: Record<string, string> = {
    integer: 'INTEGER',
    float: 'DOUBLE PRECISION',
    date: 'TIMESTAMP',
    boolean: 'BOOLEAN',
    phone: 'VARCHAR(50)',
    gps: 'VARCHAR(100)',
    identifier: 'VARCHAR(255)',
    text: 'TEXT',
  };
  return map[type] || 'TEXT';
}

export async function createDynamicTable(tableName: string, columns: ColumnInfo[]): Promise<void> {
  const colDefs = columns
    .map((col) => `"${col.name}" ${mapFieldType(col.type)} ${col.isNullable ? 'NULL' : 'NOT NULL'}`)
    .join(',\n  ');

  const sql = `
    CREATE TABLE IF NOT EXISTS "${tableName}" (
      _id SERIAL PRIMARY KEY,
      ${colDefs}
    );
  `;

  try {
    await prisma.$executeRawUnsafe(sql);
  } catch (error) {
    logger.warn(`Table ${tableName} may already exist`, error);
  }
}

export async function insertData(tableName: string, columns: ColumnInfo[], rows: DataRow[]): Promise<void> {
  if (rows.length === 0) return;
  const batchSize = 500;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const colNames = columns.map((c) => `"${c.name}"`).join(', ');
    const placeholders = batch.map((_, rowIdx) => {
      const vals = columns.map((_, colIdx) => `$${rowIdx * columns.length + colIdx + 1}`);
      return `(${vals.join(', ')})`;
    }).join(', ');

    const values = batch.flatMap((row) => columns.map((col) => row[col.name] ?? null));

    const sql = `INSERT INTO "${tableName}" (${colNames}) VALUES ${placeholders}`;

    try {
      await prisma.$executeRawUnsafe(sql, ...values);
    } catch (error) {
      logger.error(`Error inserting data into ${tableName}`, error);
      throw error;
    }
  }
}

export async function getPaginatedData(
  tableName: string,
  columns: ColumnInfo[],
  params: PaginationParams
): Promise<PaginatedResult<DataRow>> {
  const { skip, take } = paginate(params.page, params.limit);
  const conditions: string[] = [];
  const queryParams: any[] = [];
  let paramIdx = 1;

  if (params.search) {
    const searchConditions = columns
      .filter((c) => c.type === 'text' || c.type === 'identifier' || c.type === 'phone')
      .map((c) => {
        queryParams.push(`%${params.search}%`);
        return `"${c.name}"::text ILIKE $${paramIdx++}`;
      });
    if (searchConditions.length > 0) conditions.push(`(${searchConditions.join(' OR ')})`);
  }

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      const col = columns.find((c) => c.name === key);
      if (col && value) {
        queryParams.push(value);
        conditions.push(`"${key}"::text = $${paramIdx++}`);
      }
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const orderClause = params.sortField
    ? `ORDER BY "${params.sortField}" ${params.sortOrder === 'desc' ? 'DESC' : 'ASC'}`
    : 'ORDER BY _id ASC';

  const countSql = `SELECT COUNT(*) as count FROM "${tableName}" ${whereClause}`;
  const dataSql = `SELECT * FROM "${tableName}" ${whereClause} ${orderClause} LIMIT ${take} OFFSET ${skip}`;

  const [countResult]: any = await prisma.$queryRawUnsafe(countSql, ...queryParams);
  const data: any[] = await prisma.$queryRawUnsafe(dataSql, ...queryParams);

  const total = parseInt(countResult.count);
  return {
    data: data.map((row) => {
      const { _id, ...rest } = row;
      return rest;
    }),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
  };
}

export async function getAllData(tableName: string, columns: ColumnInfo[]): Promise<DataRow[]> {
  const data: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}" ORDER BY _id ASC`);
  return data.map((row) => {
    const { _id, ...rest } = row;
    return rest;
  });
}

export async function getRecord(tableName: string, columns: ColumnInfo[], id: string): Promise<DataRow | null> {
  const col = columns.find((c) => c.isPrimary) || { name: '_id' };
  const records: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "${tableName}" WHERE "${col.name}"::text = $1 LIMIT 1`, id
  );
  if (records.length === 0) return null;
  const { _id, ...rest } = records[0];
  return rest;
}

export async function createRecord(tableName: string, columns: ColumnInfo[], data: DataRow): Promise<DataRow> {
  const colNames = columns.map((c) => `"${c.name}"`).join(', ');
  const values = columns.map((c) => data[c.name] ?? null);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

  const sql = `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) RETURNING *`;
  const [record]: any = await prisma.$queryRawUnsafe(sql, ...values);
  const { _id, ...rest } = record;
  return rest;
}

export async function updateRecord(tableName: string, columns: ColumnInfo[], id: string, data: DataRow): Promise<DataRow> {
  const sets = columns.map((c, i) => `"${c.name}" = $${i + 2}`).join(', ');
  const values = columns.map((c) => data[c.name] ?? null);

  const sql = `UPDATE "${tableName}" SET ${sets} WHERE _id::text = $1 RETURNING *`;
  const [record]: any = await prisma.$queryRawUnsafe(sql, id, ...values);
  const { _id, ...rest } = record;
  return rest;
}

export async function deleteRecord(tableName: string, columns: ColumnInfo[], id: string): Promise<void> {
  await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}" WHERE _id::text = $1`, id);
}

export async function duplicateRecord(tableName: string, columns: ColumnInfo[], id: string): Promise<DataRow> {
  const original = await getRecord(tableName, columns, id);
  if (!original) throw new Error('Record not found');
  return createRecord(tableName, columns, original);
}

export async function bulkDelete(tableName: string, columns: ColumnInfo[], ids: string[]): Promise<void> {
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}" WHERE _id::text IN (${placeholders})`, ...ids);
}

export async function getStats(tableName: string, columns: ColumnInfo[]): Promise<any> {
  const numericCols = columns.filter((c) => c.type === 'integer' || c.type === 'float');
  const stats: any = { rowCount: 0, columns: {} };

  const [countResult]: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
  stats.rowCount = parseInt(countResult.count);

  for (const col of numericCols) {
    try {
      const [result]: any = await prisma.$queryRawUnsafe(`
        SELECT 
          MIN("${col.name}") as min,
          MAX("${col.name}") as max,
          AVG("${col.name}") as avg,
          SUM("${col.name}") as sum
        FROM "${tableName}"
      `);
      stats.columns[col.name] = {
        min: result.min,
        max: result.max,
        avg: result.avg ? parseFloat(result.avg) : null,
        sum: result.sum ? parseFloat(result.sum) : null,
      };
    } catch {
      // skip
    }
  }

  return stats;
}

export async function getRowCount(tableName: string): Promise<number> {
  const [result]: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
  return parseInt(result.count);
}

export async function getChartData(tableName: string, columns: ColumnInfo[], field: string, chartType: string): Promise<any> {
  const col = columns.find((c) => c.name === field);
  if (!col) throw new Error(`Field ${field} not found`);

  if (col.type === 'date') {
    const [min, max]: any = await prisma.$queryRawUnsafe(`
      SELECT MIN("${field}") as min, MAX("${field}") as max FROM "${tableName}"
    `);
    return { field, type: 'date', min: min.min, max: max.max, chartType };
  }

  const data: any[] = await prisma.$queryRawUnsafe(`
    SELECT "${field}" as key, COUNT(*) as count
    FROM "${tableName}"
    GROUP BY "${field}"
    ORDER BY count DESC
    LIMIT 20
  `);

  return {
    field,
    type: col.type,
    chartType,
    labels: data.map((d: any) => String(d.key)),
    datasets: [{ label: field, data: data.map((d: any) => parseInt(d.count)) }],
  };
}

export async function getAggregatedData(
  tableName: string, columns: ColumnInfo[],
  groupBy: string, aggregate: string, aggField?: string
): Promise<any[]> {
  const groupCol = columns.find((c) => c.name === groupBy);
  if (!groupCol) throw new Error(`Group field ${groupBy} not found`);

  let aggExpr = 'COUNT(*) as count';
  if (aggregate !== 'count' && aggField) {
    const aggCol = columns.find((c) => c.name === aggField);
    if (aggCol) {
      const func = aggregate === 'sum' ? 'SUM' : aggregate === 'avg' ? 'AVG' : 'MAX';
      aggExpr = `${func}("${aggField}") as value, COUNT(*) as count`;
    }
  }

  const data: any[] = await prisma.$queryRawUnsafe(`
    SELECT "${groupBy}" as key, ${aggExpr}
    FROM "${tableName}"
    GROUP BY "${groupBy}"
    ORDER BY count DESC
    LIMIT 50
  `);

  return data.map((d: any) => ({
    key: String(d.key),
    count: parseInt(d.count),
    value: d.value ? parseFloat(d.value) : 0,
  }));
}

export async function getTimeSeries(
  tableName: string, columns: ColumnInfo[],
  dateField: string, valueField: string, interval: string
): Promise<any> {
  const dateCol = columns.find((c) => c.name === dateField);
  if (!dateCol) throw new Error(`Date field ${dateField} not found`);

  const truncMap: Record<string, string> = {
    day: 'day', week: 'week', month: 'month', year: 'year',
  };
  const trunc = truncMap[interval] || 'month';

  let selectExpr = `DATE_TRUNC('${trunc}', "${dateField}") as date, COUNT(*) as count`;
  if (valueField) {
    const valCol = columns.find((c) => c.name === valueField);
    if (valCol) selectExpr = `DATE_TRUNC('${trunc}', "${dateField}") as date, SUM("${valueField}") as value, COUNT(*) as count`;
  }

  const data: any[] = await prisma.$queryRawUnsafe(`
    SELECT ${selectExpr}
    FROM "${tableName}"
    GROUP BY date
    ORDER BY date ASC
  `);

  return data.map((d: any) => ({
    date: d.date,
    count: parseInt(d.count),
    value: d.value ? parseFloat(d.value) : null,
  }));
}

export async function search(tableName: string, columns: ColumnInfo[], query: string): Promise<DataRow[]> {
  const conditions = columns
    .filter((c) => c.type === 'text' || c.type === 'identifier' || c.type === 'phone')
    .map((c, i) => `"${c.name}"::text ILIKE $${i + 1}`);
  if (conditions.length === 0) return [];

  const whereClause = conditions.join(' OR ');
  const params = columns.filter((c) => c.type === 'text' || c.type === 'identifier' || c.type === 'phone').map(() => `%${query}%`);

  const data: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "${tableName}" WHERE ${whereClause} LIMIT 20`, ...params
  );
  return data.map((row) => { const { _id, ...rest } = row; return rest; });
}

export async function advancedSearch(
  tableName: string, columns: ColumnInfo[],
  criteria: { field: string; operator: string; value: string }
): Promise<DataRow[]> {
  const col = columns.find((c) => c.name === criteria.field);
  if (!col) throw new Error(`Field ${criteria.field} not found`);

  const opMap: Record<string, string> = {
    equals: '=',
    contains: 'ILIKE',
    startsWith: 'ILIKE',
    endsWith: 'ILIKE',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    notEqual: '!=',
  };

  const op = opMap[criteria.operator] || '=';
  let value: string = criteria.value;

  if (criteria.operator === 'contains') value = `%${criteria.value}%`;
  else if (criteria.operator === 'startsWith') value = `${criteria.value}%`;
  else if (criteria.operator === 'endsWith') value = `%${criteria.value}`;

  const sql = `SELECT * FROM "${tableName}" WHERE "${criteria.field}"::text ${op} $1 LIMIT 100`;
  const data: any[] = await prisma.$queryRawUnsafe(sql, value);
  return data.map((row) => { const { _id, ...rest } = row; return rest; });
}

export async function getGlobalStats(): Promise<any> {
  const sheets = await prisma.sheet.findMany();
  let totalRows = 0;
  for (const sheet of sheets) {
    try {
      totalRows += await getRowCount(sheet.tableName);
    } catch { /* skip */ }
  }

  return {
    fileCount: await prisma.importedFile.count(),
    sheetCount: sheets.length,
    totalRecords: totalRows,
  };
}
