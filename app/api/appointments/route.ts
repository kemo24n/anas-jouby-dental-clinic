import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { appointmentCreateSchema } from '@/lib/validation';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { getPrimaryDentist } from '@/services/availability.service';
import { bookAppointment, SlotUnavailableError } from '@/services/appointments.service';
import { notify } from '@/lib/notifications';
import { audit } from '@/lib/audit';
import type { AppointmentStatus } from '@prisma/client';

/** GET /api/appointments?from&to&status&patientId */
export async function GET(request: Request) {
  try {
    const { session, response } = await guard('appointments.read');
    if (response) return response;

    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const status = url.searchParams.get('status') as AppointmentStatus | null;
    const patientId = url.searchParams.get('patientId');

    const appointments = await prisma.appointment.findMany({
      where: {
        ...(from || to
          ? { startsAt: { ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}) } }
          : {}),
        ...(status ? { status } : {}),
        ...(patientId ? { patientId } : {}),
      },
      orderBy: { startsAt: 'asc' },
      take: 500,
      include: {
        patient: { select: { id: true, code: true, fullName: true, phone: true } },
        service: { select: { id: true, name: true, durationMin: true } },
        dentist: { select: { id: true, fullName: true } },
      },
    });

    await audit({ userId: session.sub, action: 'VIEW', entity: 'Appointment', description: 'عرض قائمة المواعيد', request });
    return ok(appointments);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/appointments — إنشاء موعد من لوحة التحكم */
export async function POST(request: Request) {
  try {
    const { session, response } = await guard('appointments.write');
    if (response) return response;

    const body = appointmentCreateSchema.parse(await request.json());
    const dentist = await getPrimaryDentist();

    const appointment = await bookAppointment({
      patientId: body.patientId,
      dentistId: dentist.id,
      serviceId: body.serviceId,
      dateKey: body.date,
      time: body.time,
      durationMin: body.durationMin,
      reason: body.reason,
      notes: body.notes,
      createdById: session.sub,
    });

    if (appointment.patient.userId) {
      await notify({
        userId: appointment.patient.userId,
        type: 'APPOINTMENT_BOOKED',
        title: 'تم حجز موعد لك',
        body: `رقم الموعد ${appointment.code}.`,
        link: '/portal/appointments',
      });
    }

    await audit({
      userId: session.sub, action: 'CREATE', entity: 'Appointment', entityId: appointment.id,
      patientId: appointment.patientId, description: 'إنشاء موعد من لوحة التحكم', request,
    });

    return ok(appointment, 201);
  } catch (error) {
    if (error instanceof SlotUnavailableError) return fail(ERROR_MESSAGES.slotTaken, 409);
    return handleRouteError(error);
  }
}
