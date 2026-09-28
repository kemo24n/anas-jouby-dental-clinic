import { prisma } from '@/lib/db';
import { guard, requireAuth } from '@/lib/guard';
import { can } from '@/lib/permissions';
import { treatmentPlanSchema } from '@/lib/validation';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { assertPatientAccess } from '@/services/access.service';
import { notify } from '@/lib/notifications';
import { audit } from '@/lib/audit';

/** GET /api/treatment-plans?patientId= — خطط مريض واحد، أو كل الخطط الحديثة لفريق العيادة. */
export async function GET(request: Request) {
  try {
    const { session, response } = await requireAuth();
    if (response) return response;

    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId') ?? session.patientId;

    if (patientId) {
      const access = await assertPatientAccess(session, patientId, 'read');
      if (!access.allowed) return fail(ERROR_MESSAGES.forbidden, 403);
      if (session.role !== 'PATIENT' && !can(session.role, 'plans.read')) return fail(ERROR_MESSAGES.forbidden, 403);
    } else if (session.role === 'PATIENT' || !can(session.role, 'plans.read')) {
      return fail(ERROR_MESSAGES.forbidden, 403);
    }

    const plans = await prisma.treatmentPlan.findMany({
      where: { deletedAt: null, ...(patientId ? { patientId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: patientId ? undefined : 200,
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        dentalCase: { select: { id: true, title: true } },
        ...(patientId ? {} : { patient: { select: { id: true, code: true, fullName: true } } }),
      },
    });
    return ok(plans);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { session, response } = await guard('plans.write');
    if (response) return response;

    const body = treatmentPlanSchema.parse(await request.json());
    const plan = await prisma.treatmentPlan.create({
      data: {
        patientId: body.patientId,
        caseId: body.caseId,
        title: body.title,
        notes: body.notes,
        createdById: session.sub,
        items: {
          create: body.items.map((item, index) => ({
            procedure: item.procedure,
            toothNumber: item.toothNumber,
            estimatedCost: item.estimatedCost,
            notes: item.notes,
            sortOrder: index,
          })),
        },
      },
      include: { items: true, patient: { select: { userId: true, code: true } } },
    });

    if (plan.patient.userId) {
      await notify({
        userId: plan.patient.userId,
        type: 'TREATMENT_PLAN_UPDATED',
        title: 'خطة علاج جديدة',
        body: `تمت إضافة خطة علاج: ${plan.title}`,
        link: '/portal/treatment-plan',
      });
    }

    await audit({ userId: session.sub, action: 'CREATE', entity: 'TreatmentPlan', entityId: plan.id, patientId: body.patientId, description: `إنشاء خطة علاج: ${plan.title}`, request });
    return ok(plan, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
