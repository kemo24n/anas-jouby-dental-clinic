/**
 * محرّك توافر المواعيد — دالة نقية قابلة للاختبار (بدون قاعدة بيانات).
 * Appointment availability engine — pure and unit-testable.
 */

export type TimeRange = { start: Date; end: Date };

export type WorkingWindow = {
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  breakStart?: string | null;
  breakEnd?: string | null;
  isClosed?: boolean;
};

export type AvailabilityInput = {
  /** اليوم المطلوب */
  date: Date;
  /** دوام الطبيبة في هذا اليوم من الأسبوع، أو null إذا لا دوام */
  workingWindow: WorkingWindow | null;
  /** عطلة رسمية؟ */
  isHoliday?: boolean;
  /** المواعيد القائمة والفترات المحجوبة */
  busy?: TimeRange[];
  /** مدة الخدمة بالدقائق */
  durationMin: number;
  /** خطوة عرض المواعيد */
  slotMinutes?: number;
  /** فاصل تنظيف/تحضير قبل وبعد كل موعد */
  bufferMinutes?: number;
  /** لحساب "لا مواعيد في الماضي" */
  now?: Date;
};

export function parseTimeToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function atMinutes(day: Date, minutes: number): Date {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * يعيد قائمة أوقات البداية المتاحة بصيغة "HH:MM".
 * لا يعيد أبداً وقتاً يتقاطع مع موعد قائم أو استراحة أو فترة محجوبة أو وقت مضى.
 */
export function computeAvailableSlots(input: AvailabilityInput): string[] {
  const {
    date, workingWindow, isHoliday = false, busy = [],
    durationMin, slotMinutes = 30, bufferMinutes = 0, now = new Date(),
  } = input;

  if (isHoliday || !workingWindow || workingWindow.isClosed) return [];
  if (durationMin <= 0) return [];

  const dayStart = parseTimeToMinutes(workingWindow.startTime);
  const dayEnd = parseTimeToMinutes(workingWindow.endTime);
  if (dayEnd <= dayStart) return [];

  const breaks: Array<[number, number]> = [];
  if (workingWindow.breakStart && workingWindow.breakEnd) {
    breaks.push([parseTimeToMinutes(workingWindow.breakStart), parseTimeToMinutes(workingWindow.breakEnd)]);
  }

  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const busyRanges = busy.map((range) => {
    const startMin = (range.start.getTime() - midnight.getTime()) / 60000 - bufferMinutes;
    const endMin = (range.end.getTime() - midnight.getTime()) / 60000 + bufferMinutes;
    return [startMin, endMin] as [number, number];
  });

  const nowMinutes =
    now.toDateString() === midnight.toDateString()
      ? (now.getTime() - midnight.getTime()) / 60000
      : now.getTime() < midnight.getTime()
        ? -Infinity
        : Infinity;

  const slots: string[] = [];
  for (let start = dayStart; start + durationMin <= dayEnd; start += slotMinutes) {
    const end = start + durationMin;
    if (start < nowMinutes) continue;
    if (breaks.some(([bStart, bEnd]) => overlaps(start, end, bStart, bEnd))) continue;
    if (busyRanges.some(([bStart, bEnd]) => overlaps(start, end, bStart, bEnd))) continue;
    slots.push(minutesToTime(start));
  }
  return slots;
}

/** هل الوقت المطلوب ضمن المتاح فعلاً؟ يُستدعى مرة أخرى على الخادم قبل الحفظ. */
export function isSlotAvailable(input: AvailabilityInput, time: string): boolean {
  return computeAvailableSlots(input).includes(time);
}
