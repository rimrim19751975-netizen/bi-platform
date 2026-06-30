import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import * as dataController from '../controllers/dataController';

export const dataRoutes = Router();

/**
 * @swagger
 * /data/{sheetId}:
 *   post:
 *     tags: [Data]
 *     summary: Create record
 *     security: [{ bearerAuth: [] }]
 */
dataRoutes.post('/:sheetId', authenticate, dataController.createRecord);

/**
 * @swagger
 * /data/{sheetId}/{id}:
 *   put:
 *     tags: [Data]
 *     summary: Update record
 *     security: [{ bearerAuth: [] }]
 */
dataRoutes.put('/:sheetId/:id', authenticate, dataController.updateRecord);

/**
 * @swagger
 * /data/{sheetId}/{id}:
 *   delete:
 *     tags: [Data]
 *     summary: Delete record
 *     security: [{ bearerAuth: [] }]
 */
dataRoutes.delete('/:sheetId/:id', authenticate, dataController.deleteRecord);

/**
 * @swagger
 * /data/{sheetId}/{id}:
 *   get:
 *     tags: [Data]
 *     summary: Get record
 *     security: [{ bearerAuth: [] }]
 */
dataRoutes.get('/:sheetId/:id', authenticate, dataController.getRecord);

/**
 * @swagger
 * /data/{sheetId}/{id}/duplicate:
 *   post:
 *     tags: [Data]
 *     summary: Duplicate record
 *     security: [{ bearerAuth: [] }]
 */
dataRoutes.post('/:sheetId/:id/duplicate', authenticate, dataController.duplicateRecord);

/**
 * @swagger
 * /data/{sheetId}/stats:
 *   get:
 *     tags: [Data]
 *     summary: Get sheet statistics
 *     security: [{ bearerAuth: [] }]
 */
dataRoutes.get('/:sheetId/stats', authenticate, dataController.getStats);

/**
 * @swagger
 * /data/{sheetId}/bulk-delete:
 *   post:
 *     tags: [Data]
 *     summary: Bulk delete records
 *     security: [{ bearerAuth: [] }]
 */
dataRoutes.post('/:sheetId/bulk-delete', authenticate, dataController.bulkDelete);
