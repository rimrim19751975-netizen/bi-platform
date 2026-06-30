import { prisma } from '../index';

export async function createAuditLog(params: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({ data: params as any });
  } catch {
    // silently fail audit logging
  }
}
