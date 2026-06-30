import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import * as mapController from '../controllers/mapController';

export const mapRoutes = Router();

mapRoutes.get('/data', authenticate, mapController.getMapData);
mapRoutes.get('/regions', authenticate, mapController.getRegionData);
