import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import * as searchController from '../controllers/searchController';

export const searchRoutes = Router();

searchRoutes.get('/global', authenticate, searchController.globalSearch);
searchRoutes.post('/advanced', authenticate, searchController.advancedSearch);
