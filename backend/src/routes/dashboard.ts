import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import * as dashboardController from '../controllers/dashboardController';

export const dashboardRoutes = Router();

dashboardRoutes.post('/', authenticate, dashboardController.createDashboard);
dashboardRoutes.get('/', authenticate, dashboardController.listDashboards);
dashboardRoutes.get('/default', authenticate, dashboardController.getDefaultDashboard);
dashboardRoutes.get('/:id', authenticate, dashboardController.getDashboard);
dashboardRoutes.put('/:id', authenticate, dashboardController.updateDashboard);
dashboardRoutes.delete('/:id', authenticate, dashboardController.deleteDashboard);
