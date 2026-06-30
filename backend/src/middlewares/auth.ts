import { Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'bi-platform-secret';

export const authenticate: RequestHandler = (req, res, next) => {
  const authReq = req as AuthRequest;
  const authHeader = authReq.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    authReq.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const authReq = req as AuthRequest;
  const authHeader = authReq.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      authReq.user = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      // ignore invalid token
    }
  }
  next();
};

export function authorize(...roles: UserRole[]) {
  return ((req, res, next) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(authReq.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  }) as RequestHandler;
}
