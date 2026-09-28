import { prisma } from '@/lib/db';
import { guard, requireAuth } from '@/lib/guard';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { assertPatientAccess, canSeeClinical } from '@/services/access.service';
import { storage } from '@/lib/storage';
import { audit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

/** GET — تنزيل/معاينة ملف. الوصول يمر دائماً عبر التحقق من الصلاحية. */
export async function GET(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await requireAuth();
    if (response) return response;

    const file = await prisma.patientFile.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!file) return fail(ERROR_MESSAGES.notFound, 404);

    const access = await assertPatientAccess(session, file.patientId, 'read');
    if (!access.allowed) return fail(ERROR_MESSAGES.forbidden, 403);
    if (session.role !== 'PATIENT' && !canSeeClinical(session)) return fail(ERROR_MESSAGES.forbidden, 403);

    const data = await storage.get(file.storageKey);
    await audit({ userId: session.sub, action: 'VIEW_RECORD', entity: 'PatientFile', entityId: file.id, patientId: file.patientId, description: `فتح الملف ${file.name}`, request });

    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE — حذف ناعم للملف مع إبقاء الأثر في سجل التدقيق. */
export async function DELETE(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('files.write');
    if (response) return response;

    const file = await prisma.patientFile.findUnique({ where: { id: params.id } });
    if (!file) return fail(ERROR_MESSAGES.notFound, 404);

    await prisma.patientFile.delete({ where: { id: params.id } });
    await storage.remove(file.storageKey);
    await audit({ userId: session.sub, action: 'DELETE', entity: 'PatientFile', entityId: file.id, patientId: file.patientId, description: `تم حذف ملف: ${file.name}`, request });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
