import { handleRouteError, fail, ok } from '@/lib/api';
import { prisma } from '@/lib/db';
import { getAvailableSlots, getClinicSettings, getPrimaryDentist } from '@/services/availability.service';

/** GET /api/availability?date=YYYY-MM-DD&serviceId=... — أوقات متاحة للحجز العام. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const serviceId = url.searchParams.get('serviceId');
    const ignore = url.searchParams.get('ignoreAppointmentId') ?? undefined;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('يرجى تحديد تاريخ صحيح.', 400);

    const settings = await getClinicSettings();
    const dentist = await getPrimaryDentist();

    let durationMin = settings.slotMinutes;
    if (serviceId) {
      const service = await prisma.service.findFirst({ where: { id: serviceId, isActive: true } });
      if (!service) return fail('الخدمة المختارة غير متاحة.', 404);
      durationMin = service.durationMin;
    }

    const slots = await getAvailableSlots({ dentistId: dentist.id, dateKey: date, durationMin, ignoreAppointmentId: ignore });
    return ok({ date, durationMin, slots });
  } catch (error) {
    return handleRouteError(error);
  }
}
