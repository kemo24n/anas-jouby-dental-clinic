import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { planUpdateSchema } from '@/lib/validation';
import { handleRouteError, ok } from '@/lib/api';
import { notify } from '@/lib/notifications';
import { audit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('plans.write');
    if (response) return response;

    const body = planUpdateSchema.parse(await request.json());
    const plan = await prisma.treatmentPlan.update({
      where: { id: params.id },
      data: body,
      include: { patient: { select: { userId: true } } },
    });

    if (plan.patient.userId && body.status) {
      await notify({
        userId: plan.patient.userId,
        type: 'TREATMENT_PLAN_UPDATED',
        title: 'تحديث خطة العلاج',
        body: `تم تحديث حالة الخطة: ${plan.title}`,
        link: '/portal/treatment-plan',
      });
    }

    await audit({ userId: session.sub, action: 'UPDATE', entity: 'TreatmentPlan', entityId: plan.id, patientId: plan.patientId, description: 'تم تعديل خطة العلاج', request });
    return ok(plan);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('plans.write');
    if (response) return response;
    const plan = await prisma.treatmentPlan.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
    await audit({ userId: session.sub, action: 'DELETE', entity: 'TreatmentPlan', entityId: plan.id, patientId: plan.patientId, description: 'أرشفة خطة العلاج', request });
    return ok({ archived: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
