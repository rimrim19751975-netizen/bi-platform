import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import * as importController from '../controllers/importController';

export const importRoutes = Router();

/**
 * @swagger
 * /import/upload:
 *   post:
 *     tags: [Import]
 *     summary: Upload and import Excel/CSV/ODS file
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201: { description: File imported successfully }
 */
importRoutes.post('/upload', authenticate, upload.single('file'), importController.importFile);

/**
 * @swagger
 * /import/files:
 *   get:
 *     tags: [Import]
 *     summary: List imported files
 *     security: [{ bearerAuth: [] }]
 */
importRoutes.get('/files', authenticate, importController.listFiles);

/**
 * @swagger
 * /import/files/{id}:
 *   get:
 *     tags: [Import]
 *     summary: Get file details with sheets
 *     security: [{ bearerAuth: [] }]
 */
importRoutes.get('/files/:id', authenticate, importController.getFile);

/**
 * @swagger
 * /import/files/{id}:
 *   delete:
 *     tags: [Import]
 *     summary: Delete imported file
 *     security: [{ bearerAuth: [] }]
 */
importRoutes.delete('/files/:id', authenticate, importController.deleteFile);

/**
 * @swagger
 * /import/sheets/{id}:
 *   get:
 *     tags: [Import]
 *     summary: Get sheet data with pagination
 *     security: [{ bearerAuth: [] }]
 */
importRoutes.get('/sheets/:id', authenticate, importController.getSheet);

/**
 * @swagger
 * /import/sheets/{id}/columns:
 *   get:
 *     tags: [Import]
 *     summary: Get sheet columns
 *     security: [{ bearerAuth: [] }]
 */
importRoutes.get('/sheets/:id/columns', authenticate, importController.getSheetColumns);
