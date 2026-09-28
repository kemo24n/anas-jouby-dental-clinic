import { prisma } from '@/lib/db';
import { publicBookingSchema } from '@/lib/validation';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { getSession } from '@/lib/auth/session';
import { getPrimaryDentist } from '@/services/availability.service';
import { bookAppointment, SlotUnavailableError } from '@/services/appointments.service';
import { findOrCreatePatient } from '@/services/patients.service';
import { notify } from '@/lib/notifications';
import { audit } from '@/lib/audit';

/** POST /api/bookings — حجز موعد من الموقع العام (بحساب أو بدونه). */
export async function POST(request: Request) {
  try {
    const limit = rateLimit(`booking:${clientIp(request)}`, 10, 10 * 60_000);
    if (!limit.allowed) return fail(ERROR_MESSAGES.tooManyRequests, 429);

    const body = publicBookingSchema.parse(await request.json());
    const session = await getSession();
    const dentist = await getPrimaryDentist();

    const patient = session?.patientId
      ? await prisma.patient.findUnique({ where: { id: session.patientId } })
      : await findOrCreatePatient({
          fullName: body.fullName,
          phone: body.phone,
          email: body.email || undefined,
          birthDate: body.birthDate || undefined,
        });

    if (!patient) return fail(ERROR_MESSAGES.notFound, 404);

    const appointment = await bookAppointment({
      patientId: patient.id,
      dentistId: dentist.id,
      serviceId: body.serviceId,
      dateKey: body.date,
      time: body.time,
      reason: body.reason,
      notes: body.notes,
      createdById: session?.sub ?? null,
    });

    // إشعار الطبيبة — بدون أي تفاصيل سريرية
    const dentistUser = await prisma.dentist.findUnique({ where: { id: dentist.id }, select: { userId: true } });
    if (dentistUser) {
      await notify({
        userId: dentistUser.userId,
        type: 'APPOINTMENT_BOOKED',
        title: 'موعد جديد',
        body: `تم حجز موعد جديد برقم ${appointment.code}.`,
        link: '/dashboard/appointments',
      });
    }
    if (patient.userId) {
      await notify({
        userId: patient.userId,
        type: 'APPOINTMENT_BOOKED',
        title: 'تم حجز موعدك',
        body: `رقم الموعد ${appointment.code}.`,
        link: '/portal/appointments',
      });
    }

    await audit({
      userId: session?.sub ?? null,
      action: 'CREATE',
      entity: 'Appointment',
      entityId: appointment.id,
      patientId: patient.id,
      description: 'تم إنشاء موعد من الموقع العام',
      request,
    });

    return ok(
      {
        code: appointment.code,
        startsAt: appointment.startsAt,
        serviceName: appointment.service?.name ?? null,
        dentistName: appointment.dentist.fullName,
        // لا نُعيد اسم الملف الموجود لزائر غير مسجّل (منع معرفة الاسم من رقم الهاتف)
        patientName: session?.patientId ? patient.fullName : body.fullName,
      },
      201,
    );
  } catch (error) {
    if (error instanceof SlotUnavailableError) return fail(error.message, 409);
    return handleRouteError(error);
  }
}
