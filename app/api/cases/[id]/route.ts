import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { caseSchema } from '@/lib/validation';
import { handleRouteError, ok } from '@/lib/api';
import { audit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('cases.write');
    if (response) return response;

    const body = caseSchema.partial().parse(await request.json());
    const updated = await prisma.dentalCase.update({
      where: { id: params.id },
      data: {
        ...(body.title ? { title: body.title } : {}),
        ...(body.diagnosis !== undefined ? { diagnosis: body.diagnosis } : {}),
        ...(body.teeth ? { teeth: body.teeth } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.treatment !== undefined ? { treatment: body.treatment } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.status === 'COMPLETED' ? { actualEndDate: new Date() } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      },
    });

    await audit({ userId: session.sub, action: 'UPDATE', entity: 'DentalCase', entityId: updated.id, patientId: updated.patientId, description: `تعديل الحالة: ${updated.title}`, request });
    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** حذف ناعم للحالة. */
export async function DELETE(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('cases.write');
    if (response) return response;
    const updated = await prisma.dentalCase.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
    await audit({ userId: session.sub, action: 'DELETE', entity: 'DentalCase', entityId: updated.id, patientId: updated.patientId, description: `أرشفة الحالة: ${updated.title}`, request });
    return ok({ archived: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
