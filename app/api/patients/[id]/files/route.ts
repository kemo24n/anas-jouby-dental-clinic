import { prisma } from '@/lib/db';
import { guard, requireAuth } from '@/lib/guard';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { assertPatientAccess, canSeeClinical } from '@/services/access.service';
import { assertUploadAllowed, buildStorageKeyForMime, sniffMime, storage } from '@/lib/storage';
import { audit } from '@/lib/audit';
import { env } from '@/lib/env';
import { $Enums, type FileKind } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

const FILE_KINDS = new Set<string>(Object.values($Enums.FileKind));

export async function GET(_request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await requireAuth();
    if (response) return response;
    const access = await assertPatientAccess(session, params.id, 'read');
    if (!access.allowed) return fail(ERROR_MESSAGES.forbidden, 403);
    // الصور الشعاعية والمستندات الطبية محتوى سريري — لا تراها موظفة الاستقبال
    if (session.role !== 'PATIENT' && !canSeeClinical(session)) return fail(ERROR_MESSAGES.forbidden, 403);

    const files = await prisma.patientFile.findMany({
      where: { patientId: params.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, kind: true, mimeType: true, sizeBytes: true, toothNumber: true, createdAt: true, caseId: true },
    });
    return ok(files);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST — رفع ملف (multipart/form-data). يتم التحقق من النوع والحجم قبل الحفظ. */
export async function POST(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('files.write');
    if (response) return response;

    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > (env.maxUploadMb + 1) * 1024 * 1024) {
      return fail(`حجم الملف يتجاوز الحد المسموح (${env.maxUploadMb} ميغابايت).`, 413);
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return fail('يرجى اختيار ملف.', 400);

    const patient = await prisma.patient.findFirst({ where: { id: params.id, deletedAt: null }, select: { id: true } });
    if (!patient) return fail(ERROR_MESSAGES.notFound, 404);

    const kindRaw = String(form.get('kind') || 'DOCUMENT');
    const kind = (FILE_KINDS.has(kindRaw) ? kindRaw : 'DOCUMENT') as FileKind;
    const caseId = (form.get('caseId') as string) || null;
    if (caseId) {
      const owned = await prisma.dentalCase.findFirst({ where: { id: caseId, patientId: params.id }, select: { id: true } });
      if (!owned) return fail(ERROR_MESSAGES.validation, 422);
    }
    const toothRaw = form.get('toothNumber') ? Number(form.get('toothNumber')) : null;
    const toothNumber = toothRaw && Number.isInteger(toothRaw) && toothRaw >= 11 && toothRaw <= 85 ? toothRaw : null;

    assertUploadAllowed(file.type, file.size);

    const buffer = Buffer.from(await file.arrayBuffer());
    const realMime = sniffMime(buffer);
    if (!realMime) return fail('نوع الملف غير مدعوم. المسموح: JPG، PNG، WEBP، PDF.', 415);

    const storageKey = buildStorageKeyForMime(params.id, realMime);
    await storage.put(storageKey, buffer, realMime);

    const record = await prisma.patientFile.create({
      data: {
        patientId: params.id,
        caseId,
        name: file.name.slice(0, 180),
        storageKey,
        mimeType: realMime,
        sizeBytes: buffer.length,
        kind,
        toothNumber,
        uploadedById: session.sub,
      },
      select: { id: true, name: true, kind: true, mimeType: true, sizeBytes: true, createdAt: true },
    });

    await audit({ userId: session.sub, action: 'CREATE', entity: 'PatientFile', entityId: record.id, patientId: params.id, description: `رفع ملف: ${record.name}`, request });
    return ok(record, 201);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('نوع الملف')) return fail(error.message, 415);
    if (error instanceof Error && error.message.startsWith('حجم الملف')) return fail(error.message, 413);
    return handleRouteError(error);
  }
}
