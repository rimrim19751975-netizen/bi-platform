import serverless from 'serverless-http';
import { prisma } from '../src/index';
import app from '../src/index';

export const handler = serverless(app);
