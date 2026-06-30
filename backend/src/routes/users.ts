import { Router } from 'express';

export const userRoutes = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
userRoutes.get('/', (req, res) => res.json({ message: 'Users endpoint' }));
