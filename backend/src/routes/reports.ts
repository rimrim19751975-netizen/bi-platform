import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import * as reportController from '../controllers/reportController';

export const reportRoutes = Router();

reportRoutes.post('/', authenticate, reportController.createReport);
reportRoutes.get('/', authenticate, reportController.listReports);
reportRoutes.get('/:id', authenticate, reportController.getReport);
reportRoutes.put('/:id', authenticate, reportController.updateReport);
reportRoutes.delete('/:id', authenticate, reportController.deleteReport);
reportRoutes.post('/:id/generate', authenticate, reportController.generateReport);
