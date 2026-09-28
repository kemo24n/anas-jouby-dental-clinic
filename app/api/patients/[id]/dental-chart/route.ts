import { prisma } from '@/lib/db';
import { guard, requireAuth } from '@/lib/guard';
import { chartRecordSchema } from '@/lib/validation';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { assertPatientAccess, canSeeClinical } from '@/services/access.service';
import { audit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await requireAuth();
    if (response) return response;
    const access = await assertPatientAccess(session, params.id, 'read');
    if (!access.allowed) return fail(ERROR_MESSAGES.forbidden, 403);
    if (!canSeeClinical(session) && session.role !== 'PATIENT') return fail(ERROR_MESSAGES.forbidden, 403);

    const records = await prisma.dentalChartRecord.findMany({ where: { patientId: params.id } });
    return ok(records);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST — تحديث حالة سن واحد (تُنشأ أو تُحدَّث). */
export async function POST(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('clinical.write');
    if (response) return response;

    const body = chartRecordSchema.parse({ ...(await request.json()), patientId: params.id });
    const record = await prisma.dentalChartRecord.upsert({
      where: { patientId_toothNumber: { patientId: params.id, toothNumber: body.toothNumber } },
      update: { condition: body.condition, notes: body.notes, recordedById: session.sub, recordedAt: new Date() },
      create: {
        patientId: params.id,
        toothNumber: body.toothNumber,
        condition: body.condition,
        notes: body.notes,
        recordedById: session.sub,
      },
    });

    await audit({
      userId: session.sub, action: 'UPDATE', entity: 'DentalChart', entityId: record.id, patientId: params.id,
      description: `تحديث مخطط الأسنان — السن ${body.toothNumber}`, request,
    });
    return ok(record);
  } catch (error) {
    return handleRouteError(error);
  }
}
