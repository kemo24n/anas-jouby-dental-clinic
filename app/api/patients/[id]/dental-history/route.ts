import { prisma } from '@/lib/db';
import { guard, requireAuth } from '@/lib/guard';
import { dentalHistorySchema } from '@/lib/validation';
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
    if (!canSeeClinical(session) && session.role !== 'PATIENT') return fail(ERROR_MESSAGES.forbidden, 403);

    const history = await prisma.patientDentalHistory.findUnique({ where: { patientId: params.id } });
    void request;
    return ok(history);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('clinical.write');
    if (response) return response;

    const body = dentalHistorySchema.parse(await request.json());
    const history = await prisma.patientDentalHistory.upsert({
      where: { patientId: params.id },
      update: body,
      create: { patientId: params.id, ...body },
    });

    await audit({ userId: session.sub, action: 'UPDATE', entity: 'DentalHistory', entityId: history.id, patientId: params.id, description: 'تم تعديل التاريخ السني', request });
    return ok(history);
  } catch (error) {
    return handleRouteError(error);
  }
}
