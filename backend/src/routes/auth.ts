import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import * as authController from '../controllers/authController';

export const authRoutes = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
authRoutes.post('/login', authController.login);

/**
 * @swagger
 * /auth/verify-2fa:
 *   post:
 *     tags: [Auth]
 *     summary: Verify 2FA code
 */
authRoutes.post('/verify-2fa', authController.verify2FA);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh token
 */
authRoutes.post('/refresh', authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout
 */
authRoutes.post('/logout', authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     security: [{ bearerAuth: [] }]
 */
authRoutes.get('/me', authenticate, authController.me);

/**
 * @swagger
 * /auth/setup-2fa:
 *   get:
 *     tags: [Auth]
 *     summary: Setup 2FA
 *     security: [{ bearerAuth: [] }]
 */
authRoutes.get('/setup-2fa', authenticate, authController.setup2FA);

/**
 * @swagger
 * /auth/enable-2fa:
 *   post:
 *     tags: [Auth]
 *     summary: Enable 2FA
 *     security: [{ bearerAuth: [] }]
 */
authRoutes.post('/enable-2fa', authenticate, authController.enable2FA);

/**
 * @swagger
 * /auth/disable-2fa:
 *   post:
 *     tags: [Auth]
 *     summary: Disable 2FA
 *     security: [{ bearerAuth: [] }]
 */
authRoutes.post('/disable-2fa', authenticate, authController.disable2FA);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password
 *     security: [{ bearerAuth: [] }]
 */
authRoutes.post('/change-password', authenticate, authController.changePassword);
