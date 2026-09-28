import type { Session } from '@/lib/auth/session';
import { can, isStaff } from '@/lib/permissions';
import { prisma } from '@/lib/db';

/**
 * حارس الوصول إلى ملف مريض. يُستدعى في كل مسار يعرض أو يعدّل بيانات مريض.
 * المريض يرى ملفه فقط؛ موظفة الاستقبال لا ترى المعلومات السريرية.
 */
export async function assertPatientAccess(session: Session, patientId: string, mode: 'read' | 'write' = 'read') {
  if (session.role === 'PATIENT') {
    if (session.patientId !== patientId) return { allowed: false as const, reason: 'forbidden' as const };
    return { allowed: mode === 'read', reason: mode === 'read' ? undefined : ('forbidden' as const) };
  }
  if (!isStaff(session.role)) return { allowed: false as const, reason: 'forbidden' as const };
  const permission = mode === 'read' ? 'patients.read' : 'patients.write';
  if (!can(session.role, permission)) return { allowed: false as const, reason: 'forbidden' as const };

  const patient = await prisma.patient.findFirst({ where: { id: patientId, deletedAt: null }, select: { id: true } });
  if (!patient) return { allowed: false as const, reason: 'notFound' as const };
  return { allowed: true as const, reason: undefined };
}

/** هل يملك هذا المستخدم حق رؤية المحتوى السريري (سجل طبي، ملاحظات، مخطط أسنان)؟ */
export function canSeeClinical(session: Session) {
  return can(session.role, 'clinical.read');
}
