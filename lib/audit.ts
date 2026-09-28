import { prisma } from './db';
import { clientIp } from './rate-limit';

type AuditInput = {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  patientId?: string | null;
  description: string;
  request?: Request;
};

/** تسجيل أثر — لا يفشل الطلب الأساسي إذا فشل التسجيل. */
export async function audit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        patientId: input.patientId ?? null,
        description: input.description,
        ip: input.request ? clientIp(input.request) : null,
        userAgent: input.request?.headers.get('user-agent')?.slice(0, 250) ?? null,
      },
    });
  } catch (error) {
    console.error('[audit] تعذّر تسجيل الأثر', error);
  }
}
