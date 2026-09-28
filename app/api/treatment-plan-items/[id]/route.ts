import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { planItemUpdateSchema } from '@/lib/validation';
import { handleRouteError, ok } from '@/lib/api';
import { audit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('plans.write');
    if (response) return response;

    const body = planItemUpdateSchema.parse(await request.json());
    const item = await prisma.treatmentPlanItem.update({
      where: { id: params.id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.actualCost !== undefined ? { actualCost: body.actualCost } : {}),
        ...(body.scheduledDate ? { scheduledDate: new Date(body.scheduledDate) } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      },
      include: { plan: { select: { patientId: true } } },
    });

    await audit({ userId: session.sub, action: 'UPDATE', entity: 'TreatmentPlanItem', entityId: item.id, patientId: item.plan.patientId, description: `تعديل إجراء: ${item.procedure}`, request });
    return ok(item);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('plans.write');
    if (response) return response;
    const item = await prisma.treatmentPlanItem.delete({ where: { id: params.id } });
    await audit({ userId: session.sub, action: 'DELETE', entity: 'TreatmentPlanItem', entityId: item.id, description: `حذف إجراء: ${item.procedure}`, request });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
