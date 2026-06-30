import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middlewares/errorHandler';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { importRoutes } from './routes/import';
import { dataRoutes } from './routes/data';
import { analyticsRoutes } from './routes/analytics';
import { exportRoutes } from './routes/exports';
import { reportRoutes } from './routes/reports';
import { dashboardRoutes } from './routes/dashboard';
import { adminRoutes } from './routes/admin';
import { searchRoutes } from './routes/search';
import { mapRoutes } from './routes/map';
import { logger } from './utils/logger';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.APP_URL || 'http://localhost:3000',
      'http://localhost:3001',
      /\.ngrok-free\.app$/,
    ];
    if (!origin || allowedOrigins.some((o) => (typeof o === 'string' ? o === origin : o.test(origin)))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (msg: string) => logger.info(msg.trim()) } }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/import', importRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/map', mapRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(errorHandler);

async function main() {
  try {
    await prisma.$connect();
    logger.info('Database connected');
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

main();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
