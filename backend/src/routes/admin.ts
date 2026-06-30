import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import * as adminController from '../controllers/adminController';

export const adminRoutes = Router();

adminRoutes.use(authenticate);
adminRoutes.use(authorize('SUPER_ADMIN', 'ADMIN'));

adminRoutes.get('/users', adminController.listUsers);
adminRoutes.post('/users', adminController.createUser);
adminRoutes.put('/users/:id', adminController.updateUser);
adminRoutes.delete('/users/:id', adminController.deleteUser);
adminRoutes.get('/audit-logs', adminController.getAuditLogs);
adminRoutes.get('/stats', adminController.getSystemStats);
