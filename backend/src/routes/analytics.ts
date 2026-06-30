import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import * as analyticsController from '../controllers/analyticsController';

export const analyticsRoutes = Router();

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     tags: [Analytics]
 *     summary: Get dashboard statistics
 *     security: [{ bearerAuth: [] }]
 */
analyticsRoutes.get('/dashboard', authenticate, analyticsController.getDashboardStats);

/**
 * @swagger
 * /analytics/chart:
 *   get:
 *     tags: [Analytics]
 *     summary: Get chart data
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: sheetId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: field
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: chartType
 *         schema: { type: string, enum: [bar, pie, line, radar, treemap, sunburst] }
 */
analyticsRoutes.get('/chart', authenticate, analyticsController.getChartData);

/**
 * @swagger
 * /analytics/advanced:
 *   get:
 *     tags: [Analytics]
 *     summary: Get advanced analytics
 *     security: [{ bearerAuth: [] }]
 */
analyticsRoutes.get('/advanced', authenticate, analyticsController.getAdvancedAnalytics);

/**
 * @swagger
 * /analytics/timeseries:
 *   get:
 *     tags: [Analytics]
 *     summary: Get time series data
 *     security: [{ bearerAuth: [] }]
 */
analyticsRoutes.get('/timeseries', authenticate, analyticsController.getTimeSeries);
