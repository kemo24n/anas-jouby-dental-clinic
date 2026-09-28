import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { appointmentUpdateSchema } from '@/lib/validation';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { rescheduleAppointment, SlotUnavailableError } from '@/services/appointments.service';
import { cancelAppointmentReminders, notify } from '@/lib/notifications';
import { audit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('appointments.read');
    if (response) return response;
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { patient: true, service: true, dentist: true },
    });
    if (!appointment) return fail(ERROR_MESSAGES.notFound, 404);
    // موظفة الاستقبال ترى الموعد لكن لا ترى الملاحظات السريرية المرتبطة
    void session;
    return ok(appointment);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH — تغيير الحالة، إعادة الجدولة، الإلغاء، أو إضافة ملاحظة إدارية. */
export async function PATCH(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('appointments.write');
    if (response) return response;

    const body = appointmentUpdateSchema.parse(await request.json());
    const current = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { patient: { select: { id: true, userId: true } } },
    });
    if (!current) return fail(ERROR_MESSAGES.notFound, 404);

    if (body.date && body.time) {
      await rescheduleAppointment(params.id, body.date, body.time);
    }

    const data: Record<string, unknown> = {};
    if (body.status) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.status === 'CANCELLED') {
      data.cancelledAt = new Date();
      data.cancelReason = body.cancelReason ?? null;
      await cancelAppointmentReminders(params.id);
    }

    const updated = Object.keys(data).length
      ? await prisma.appointment.update({ where: { id: params.id }, data })
      : await prisma.appointment.findUniqueOrThrow({ where: { id: params.id } });

    if (current.patient.userId && body.status) {
      const titles: Record<string, string> = {
        CONFIRMED: 'تم تأكيد موعدك',
        CANCELLED: 'تم إلغاء موعدك',
        COMPLETED: 'تم إكمال موعدك',
      };
      if (titles[body.status]) {
        await notify({
          userId: current.patient.userId,
          type: body.status === 'CANCELLED' ? 'APPOINTMENT_CANCELLED' : 'APPOINTMENT_CONFIRMED',
          title: titles[body.status],
          body: `رقم الموعد ${current.code}.`,
          link: '/portal/appointments',
        });
      }
    }

    await audit({
      userId: session.sub, action: 'UPDATE', entity: 'Appointment', entityId: params.id,
      patientId: current.patientId, description: `تعديل الموعد ${current.code}`, request,
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof SlotUnavailableError) return fail(ERROR_MESSAGES.slotTaken, 409);
    return handleRouteError(error);
  }
}

/** DELETE — حذف الموعد نهائياً. */
export async function DELETE(request: Request, props: Params) {
  const { id } = await props.params;
  try {
    const { session, response } = await guard('appointments.write', ['ADMIN']);
    if (response) return response;
    const appt = await prisma.appointment.delete({ where: { id } });
    await audit({
      userId: session.sub, action: 'DELETE', entity: 'Appointment', entityId: appt.id, patientId: appt.patientId,
      description: `حذف الموعد ${appt.code}`, request,
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
