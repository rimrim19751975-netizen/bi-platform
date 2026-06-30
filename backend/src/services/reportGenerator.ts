import PDFDocument from 'pdfkit';
import { prisma } from '../index';

interface ReportConfig {
  title: string;
  sheets: string[];
  chartType?: string;
  groupBy?: string;
  dateRange?: { start: string; end: string };
  includeCharts?: boolean;
  includeStats?: boolean;
}

export async function generatePDFReport(config: ReportConfig): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4', info: { Title: config.title } });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text(config.title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown(2);

      for (const sheetId of config.sheets) {
        const sheet = await prisma.sheet.findUnique({
          where: { id: sheetId },
          include: { columns: { orderBy: { position: 'asc' } } },
        });
        if (!sheet) continue;

        doc.fontSize(14).text(sheet.name, { underline: true });
        doc.moveDown(0.5);

        const fields = sheet.columns.map((c) => ({ name: c.name, type: c.dataType }));
        const dynamicService = await import('./dynamicTable');
        const data = await dynamicService.getAllData(sheet.tableName, fields);

        if (config.includeStats) {
          const stats = await dynamicService.getStats(sheet.tableName, fields);
          doc.fontSize(10).text(`Total records: ${stats.rowCount}`);
          for (const [colName, colStats] of Object.entries(stats.columns)) {
            const s = colStats as any;
            doc.fontSize(8).text(`${colName}: Min=${s.min}, Max=${s.max}, Avg=${s.avg?.toFixed(2) || '-'}, Sum=${s.sum?.toFixed(2) || '-'}`);
          }
          doc.moveDown();
        }

        const headers = fields.map((f) => f.name);
        const colWidth = Math.min(120, Math.floor((doc.page.width - 80) / headers.length));
        let y = doc.y;

        headers.forEach((h, i) => {
          doc.fontSize(7).font('Helvetica-Bold').text(h, 40 + i * colWidth, y, { width: colWidth });
        });
        y += 12;

        const displayData = data.slice(0, config.includeCharts ? 30 : 100);
        displayData.forEach((row: any) => {
          if (y > doc.page.height - 50) { doc.addPage(); y = 30; }
          headers.forEach((h, i) => {
            doc.fontSize(6).font('Helvetica').text(String(row[h] ?? ''), 40 + i * colWidth, y, { width: colWidth });
          });
          y += 10;
        });

        doc.addPage();
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
