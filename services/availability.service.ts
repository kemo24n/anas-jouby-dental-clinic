import { prisma } from '@/lib/db';
import { computeAvailableSlots, atMinutes, parseTimeToMinutes } from '@/lib/availability';

export async function getPrimaryDentist() {
  const dentist = await prisma.dentist.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
  if (!dentist) throw new Error('لا توجد طبيبة مسجّلة في النظام.');
  return dentist;
}

export async function getClinicSettings() {
  const existing = await prisma.clinicSettings.findUnique({ where: { id: 'singleton' } });
  return existing ?? prisma.clinicSettings.create({ data: { id: 'singleton' } });
}

/** أوقات البدء المتاحة ليوم محدد، محسوبة من الدوام والمواعيد القائمة والحجب والعطل. */
export async function getAvailableSlots(params: {
  dentistId: string;
  dateKey: string; // YYYY-MM-DD
  durationMin: number;
  ignoreAppointmentId?: string;
}) {
  const { dentistId, dateKey, durationMin, ignoreAppointmentId } = params;
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return [];

  const dayStart = new Date(date);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const [settings, workingHour, holiday, appointments, blocked] = await Promise.all([
    getClinicSettings(),
    prisma.workingHour.findUnique({ where: { dentistId_weekday: { dentistId, weekday: date.getDay() } } }),
    prisma.holiday.findFirst({ where: { date } }),
    prisma.appointment.findMany({
      where: {
        dentistId,
        startsAt: { gte: dayStart, lte: dayEnd },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        ...(ignoreAppointmentId ? { id: { not: ignoreAppointmentId } } : {}),
      },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.blockedTime.findMany({
      where: { dentistId, startsAt: { lte: dayEnd }, endsAt: { gte: dayStart } },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  return computeAvailableSlots({
    date,
    workingWindow: workingHour
      ? {
          startTime: workingHour.startTime,
          endTime: workingHour.endTime,
          breakStart: workingHour.breakStart,
          breakEnd: workingHour.breakEnd,
          isClosed: workingHour.isClosed,
        }
      : null,
    isHoliday: !!holiday,
    busy: [...appointments, ...blocked].map((r) => ({ start: r.startsAt, end: r.endsAt })),
    durationMin,
    slotMinutes: settings.slotMinutes,
    bufferMinutes: settings.bufferMinutes,
    now: new Date(),
  });
}

export function slotToDate(dateKey: string, time: string) {
  const day = new Date(`${dateKey}T00:00:00`);
  return atMinutes(day, parseTimeToMinutes(time));
}
