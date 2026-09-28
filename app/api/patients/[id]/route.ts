import { prisma } from '@/lib/db';
import { guard, requireAuth } from '@/lib/guard';
import { patientSchema } from '@/lib/validation';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { assertPatientAccess, canSeeClinical } from '@/services/access.service';
import { audit } from '@/lib/audit';
import { storage } from '@/lib/storage';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await requireAuth();
    if (response) return response;

    const access = await assertPatientAccess(session, params.id, 'read');
    if (!access.allowed) {
      return fail(access.reason === 'notFound' ? ERROR_MESSAGES.notFound : ERROR_MESSAGES.forbidden, access.reason === 'notFound' ? 404 : 403);
    }

    const clinical = canSeeClinical(session) || session.role === 'PATIENT';
    const patient = await prisma.patient.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        medicalHistory: clinical,
        dentalHistory: clinical,
        appointments: { orderBy: { startsAt: 'desc' }, include: { service: true } },
        payments: { where: { deletedAt: null }, orderBy: { paidAt: 'desc' } },
      },
    });
    if (!patient) return fail(ERROR_MESSAGES.notFound, 404);

    await audit({
      userId: session.sub, action: 'VIEW_RECORD', entity: 'Patient', entityId: patient.id,
      patientId: patient.id, description: `اطّلاع على ملف المريض ${patient.code}`, request,
    });

    return ok(patient);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('patients.write');
    if (response) return response;

    const body = patientSchema.partial().parse(await request.json());
    const patient = await prisma.patient.update({
      where: { id: params.id },
      data: {
        ...(body.fullName ? { fullName: body.fullName } : {}),
        ...(body.phone ? { phone: body.phone } : {}),
        ...(body.email !== undefined ? { email: body.email || null } : {}),
        ...(body.birthDate ? { birthDate: new Date(body.birthDate) } : {}),
        ...(body.gender ? { gender: body.gender } : {}),
        ...(body.address !== undefined ? { address: body.address } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      },
    });

    await audit({
      userId: session.sub, action: 'UPDATE', entity: 'Patient', entityId: patient.id,
      patientId: patient.id, description: `تعديل بيانات المريض ${patient.code}`, request,
    });

    return ok(patient);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE — حذف ناعم فقط. السجلات الطبية لا تُمحى من قاعدة البيانات. */
export async function DELETE(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('patients.delete', ['ADMIN']);
    if (response) return response;

    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: { files: { select: { storageKey: true } } },
    });
    if (!patient) return fail(ERROR_MESSAGES.notFound, 404);

    // حذف نهائي: المواعيد والمدفوعات ثم الملف (باقي السجلات تُحذف تلقائياً معه) ثم حساب البوابة
    await prisma.$transaction([
      prisma.appointment.deleteMany({ where: { patientId: patient.id } }),
      prisma.payment.deleteMany({ where: { patientId: patient.id } }),
      prisma.patient.delete({ where: { id: patient.id } }),
      ...(patient.userId ? [prisma.user.deleteMany({ where: { id: patient.userId, role: 'PATIENT' } })] : []),
    ]);
    await Promise.all(patient.files.map((f) => storage.remove(f.storageKey)));

    await audit({
      userId: session.sub, action: 'DELETE', entity: 'Patient', entityId: patient.id,
      description: `حذف نهائي لملف المريض ${patient.code}`, request,
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
