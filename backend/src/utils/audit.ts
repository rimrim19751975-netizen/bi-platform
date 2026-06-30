import { prisma } from '../index';

export async function createAuditLog(params: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: unknown;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch {
    // silently fail audit logging
  }
}
