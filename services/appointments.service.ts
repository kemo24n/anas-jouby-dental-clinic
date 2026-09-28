import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getAvailableSlots, getClinicSettings, slotToDate } from './availability.service';
import { scheduleAppointmentReminders } from '@/lib/notifications';

export class SlotUnavailableError extends Error {
  constructor() {
    super('هذا الموعد لم يعد متاحاً. يرجى اختيار وقت آخر.');
    this.name = 'SlotUnavailableError';
  }
}

export async function nextAppointmentCode(date: Date) {
  const stamp = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const count = await prisma.appointment.count();
  return `A-${stamp}-${String(count + 1).padStart(4, '0')}`;
}

type BookInput = {
  patientId: string;
  dentistId: string;
  serviceId?: string | null;
  dateKey: string;
  time: string;
  durationMin?: number;
  reason?: string;
  notes?: string;
  createdById?: string | null;
};

/**
 * حجز موعد مع منع الحجز المزدوج على مستويين:
 * 1) إعادة التحقق من التوافر على الخادم قبل الحفظ
 * 2) قيد فريد في قاعدة البيانات (dentistId, startsAt) — يمنع السباق بين طلبين متزامنين
 */
export async function bookAppointment(input: BookInput) {
  const settings = await getClinicSettings();
  let durationMin = input.durationMin ?? settings.slotMinutes;
  if (input.serviceId) {
    const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
    if (service?.durationMin) durationMin = service.durationMin;
  }

  const slots = await getAvailableSlots({
    dentistId: input.dentistId,
    dateKey: input.dateKey,
    durationMin,
  });
  if (!slots.includes(input.time)) throw new SlotUnavailableError();

  const startsAt = slotToDate(input.dateKey, input.time);
  const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);

  try {
    const appointment = await prisma.appointment.create({
      data: {
        code: await nextAppointmentCode(startsAt),
        patientId: input.patientId,
        dentistId: input.dentistId,
        serviceId: input.serviceId || null,
        startsAt,
        endsAt,
        reason: input.reason,
        notes: input.notes,
        createdById: input.createdById || null,
      },
      include: { service: true, patient: true, dentist: true },
    });
    await scheduleAppointmentReminders(appointment.id, startsAt);
    return appointment;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new SlotUnavailableError();
    }
    throw error;
  }
}

export async function rescheduleAppointment(id: string, dateKey: string, time: string) {
  const current = await prisma.appointment.findUnique({ where: { id }, include: { service: true } });
  if (!current) throw new Error('الموعد غير موجود.');

  const durationMin = Math.round((current.endsAt.getTime() - current.startsAt.getTime()) / 60000);
  const slots = await getAvailableSlots({
    dentistId: current.dentistId,
    dateKey,
    durationMin,
    ignoreAppointmentId: id,
  });
  if (!slots.includes(time)) throw new SlotUnavailableError();

  const startsAt = slotToDate(dateKey, time);
  const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);

  try {
    const updated = await prisma.appointment.update({
      where: { id },
      data: { startsAt, endsAt, status: 'RESCHEDULED', rescheduledFromId: id },
    });
    await scheduleAppointmentReminders(id, startsAt);
    return updated;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new SlotUnavailableError();
    }
    throw error;
  }
}
