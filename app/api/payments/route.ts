import { prisma } from '@/lib/db';
import { guard, requireAuth } from '@/lib/guard';
import { paymentSchema } from '@/lib/validation';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { assertPatientAccess } from '@/services/access.service';
import { notify } from '@/lib/notifications';
import { audit } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const { session, response } = await requireAuth();
    if (response) return response;

    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId') ?? session.patientId;

    if (patientId) {
      const access = await assertPatientAccess(session, patientId, 'read');
      if (!access.allowed) return fail(ERROR_MESSAGES.forbidden, 403);
    } else if (session.role === 'PATIENT') {
      return fail(ERROR_MESSAGES.forbidden, 403);
    }

    const payments = await prisma.payment.findMany({
      where: { deletedAt: null, ...(patientId ? { patientId } : {}) },
      orderBy: { paidAt: 'desc' },
      take: 300,
      include: { patient: { select: { id: true, code: true, fullName: true } } },
    });
    return ok(payments);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { session, response } = await guard('payments.write');
    if (response) return response;

    const body = paymentSchema.parse(await request.json());
    const payment = await prisma.payment.create({
      data: {
        patientId: body.patientId,
        amount: body.amount,
        method: body.method,
        appointmentId: body.appointmentId,
        treatmentPlanId: body.treatmentPlanId,
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        notes: body.notes,
        recordedById: session.sub,
      },
      include: { patient: { select: { userId: true, code: true } } },
    });

    if (payment.patient.userId) {
      await notify({
        userId: payment.patient.userId,
        type: 'PAYMENT_RECORDED',
        title: 'تم تسجيل دفعة',
        body: `تم تسجيل دفعة بقيمة ${Number(payment.amount)} $ في ملفك.`,
        link: '/portal',
      });
    }

    await audit({ userId: session.sub, action: 'CREATE', entity: 'Payment', entityId: payment.id, patientId: body.patientId, description: `تسجيل دفعة بقيمة ${body.amount}`, request });
    return ok(payment, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
