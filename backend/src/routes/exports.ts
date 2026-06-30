import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import * as exportController from '../controllers/exportController';

export const exportRoutes = Router();

/**
 * @swagger
 * /exports/{sheetId}/excel:
 *   get:
 *     tags: [Exports]
 *     summary: Export sheet to Excel
 *     security: [{ bearerAuth: [] }]
 */
exportRoutes.get('/:sheetId/excel', authenticate, exportController.exportExcel);

/**
 * @swagger
 * /exports/{sheetId}/csv:
 *   get:
 *     tags: [Exports]
 *     summary: Export sheet to CSV
 *     security: [{ bearerAuth: [] }]
 */
exportRoutes.get('/:sheetId/csv', authenticate, exportController.exportCSV);

/**
 * @swagger
 * /exports/{sheetId}/pdf:
 *   get:
 *     tags: [Exports]
 *     summary: Export sheet to PDF
 *     security: [{ bearerAuth: [] }]
 */
exportRoutes.get('/:sheetId/pdf', authenticate, exportController.exportPDF);

/**
 * @swagger
 * /exports/{sheetId}/json:
 *   get:
 *     tags: [Exports]
 *     summary: Export sheet to JSON
 *     security: [{ bearerAuth: [] }]
 */
exportRoutes.get('/:sheetId/json', authenticate, exportController.exportJSON);
