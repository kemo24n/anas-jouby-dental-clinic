import { prisma } from '@/lib/db';
import { guard, requireAuth } from '@/lib/guard';
import { clinicalNoteSchema } from '@/lib/validation';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { assertPatientAccess, canSeeClinical } from '@/services/access.service';
import { audit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await requireAuth();
    if (response) return response;
    const access = await assertPatientAccess(session, params.id, 'read');
    if (!access.allowed) return fail(ERROR_MESSAGES.forbidden, 403);

    const isPatient = session.role === 'PATIENT';
    if (!canSeeClinical(session) && !isPatient) return fail(ERROR_MESSAGES.forbidden, 403);

    const notes = await prisma.clinicalNote.findMany({
      where: { patientId: params.id, ...(isPatient ? { visibleToPatient: true } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { dentist: { select: { fullName: true } }, appointment: { select: { code: true, startsAt: true } } },
    });

    await audit({ userId: session.sub, action: 'VIEW_RECORD', entity: 'ClinicalNote', patientId: params.id, description: 'اطّلاع على الملاحظات السريرية', request });
    return ok(notes);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST — إضافة ملاحظة سريرية. الطبيبة والمدير فقط؛ الملاحظات لا تُعدّل من المريض. */
export async function POST(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('clinical.write');
    if (response) return response;

    const body = clinicalNoteSchema.parse({ ...(await request.json()), patientId: params.id });
    const note = await prisma.clinicalNote.create({
      data: {
        patientId: params.id,
        dentistId: session.dentistId ?? null,
        authorId: session.sub,
        appointmentId: body.appointmentId,
        content: body.content,
        diagnosis: body.diagnosis,
        treatment: body.treatment,
        recommendations: body.recommendations,
        followUpAt: body.followUpAt ? new Date(body.followUpAt) : null,
        visibleToPatient: body.visibleToPatient ?? false,
      },
    });

    await audit({ userId: session.sub, action: 'CREATE', entity: 'ClinicalNote', entityId: note.id, patientId: params.id, description: 'إضافة ملاحظة سريرية', request });
    return ok(note, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
