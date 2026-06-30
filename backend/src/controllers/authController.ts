import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';
import { createAuditLog } from '../utils/audit';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'bi-platform-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'bi-platform-refresh-secret';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateTokens(user: { id: string; email: string; role: string }) {
  const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as string,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as string,
  } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new AppError(401, 'Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError(401, 'Invalid credentials');

    if (user.twoFactorEnabled) {
      const token = jwt.sign({ tempUserId: user.id }, JWT_SECRET, { expiresIn: '5m' });
      return res.json({ requires2FA: true, tempToken: token });
    }

    const tokens = generateTokens(user);

    await prisma.refreshToken.create({
      data: { token: tokens.refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    await createAuditLog({ userId: user.id, action: 'LOGIN', entity: 'user', entityId: user.id, ip: req.ip });

    res.json({
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
}

export async function verify2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { tempToken, code } = req.body;
    const decoded = jwt.verify(tempToken, JWT_SECRET) as { tempUserId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.tempUserId } });
    if (!user?.twoFactorSecret) throw new AppError(400, '2FA not configured');

    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: code });
    if (!verified) throw new AppError(400, 'Invalid 2FA code');

    const tokens = generateTokens(user);

    await prisma.refreshToken.create({
      data: { token: tokens.refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    res.json({
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) throw new AppError(401, 'Invalid refresh token');

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) throw new AppError(401, 'User not found');

    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const tokens = generateTokens(user);

    await prisma.refreshToken.create({
      data: { token: tokens.refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.json(tokens);
  } catch (error) {
    next(error);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    res.json({ message: 'Logged out' });
  } catch (error) {
    next(error);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, lastLoginAt: true, createdAt: true },
    });
    if (!user) throw new AppError(404, 'User not found');
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function setup2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const secret = speakeasy.generateSecret({ name: `BI Platform (${req.user!.email})` });
    const qrUrl = await qrcode.toDataURL(secret.otpauth_url!);
    res.json({ secret: secret.base32, qrUrl });
  } catch (error) {
    next(error);
  }
}

export async function enable2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { secret, code } = req.body;
    const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token: code });
    if (!verified) throw new AppError(400, 'Invalid verification code');

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { twoFactorSecret: secret, twoFactorEnabled: true },
    });

    res.json({ message: '2FA enabled' });
  } catch (error) {
    next(error);
  }
}

export async function disable2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.twoFactorSecret) throw new AppError(400, '2FA not configured');

    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: code });
    if (!verified) throw new AppError(400, 'Invalid code');

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { twoFactorSecret: null, twoFactorEnabled: false },
    });

    res.json({ message: '2FA disabled' });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError(404, 'User not found');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError(400, 'Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    res.json({ message: 'Password changed' });
  } catch (error) {
    next(error);
  }
}
