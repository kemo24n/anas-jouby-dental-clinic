import { describe, expect, it } from 'vitest';
import { computeAvailableSlots, isSlotAvailable, minutesToTime, parseTimeToMinutes } from '@/lib/availability';

function dateAt(dateKey: string, time: string) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(`${dateKey}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d;
}

describe('parseTimeToMinutes / minutesToTime', () => {
  it('يحوّل الوقت النصي إلى دقائق والعكس', () => {
    expect(parseTimeToMinutes('09:00')).toBe(540);
    expect(parseTimeToMinutes('17:30')).toBe(1050);
    expect(minutesToTime(540)).toBe('09:00');
    expect(minutesToTime(1050)).toBe('17:30');
  });
});

describe('computeAvailableSlots', () => {
  const DAY = '2026-09-21'; // اثنين افتراضي لأغراض الاختبار
  const baseWindow = { startTime: '09:00', endTime: '17:00', isClosed: false };

  it('يعيد كل الفترات عند عدم وجود مواعيد قائمة (خدمة 60 دقيقة، فاصل 0)', () => {
    const slots = computeAvailableSlots({
      date: new Date(`${DAY}T00:00:00`),
      workingWindow: baseWindow,
      durationMin: 60,
      slotMinutes: 60,
      bufferMinutes: 0,
      now: new Date(`${DAY}T00:00:00`),
    });
    // من 09:00 حتى 16:00 (آخر فترة تنتهي عند 17:00) بخطوة ساعة كاملة
    expect(slots).toEqual(['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']);
  });

  it('يستبعد الفترة التي تتقاطع مع موعد قائم (11:00–12:00 محجوز)', () => {
    const slots = computeAvailableSlots({
      date: new Date(`${DAY}T00:00:00`),
      workingWindow: baseWindow,
      durationMin: 60,
      slotMinutes: 60,
      bufferMinutes: 0,
      busy: [{ start: dateAt(DAY, '11:00'), end: dateAt(DAY, '12:00') }],
      now: new Date(`${DAY}T00:00:00`),
    });
    expect(slots).toEqual(['09:00', '10:00', '12:00', '13:00', '14:00', '15:00', '16:00']);
  });

  it('يحترم فاصل التحضير (buffer) حول الموعد القائم', () => {
    const slots = computeAvailableSlots({
      date: new Date(`${DAY}T00:00:00`),
      workingWindow: baseWindow,
      durationMin: 60,
      slotMinutes: 30,
      bufferMinutes: 15,
      busy: [{ start: dateAt(DAY, '11:00'), end: dateAt(DAY, '12:00') }],
      now: new Date(`${DAY}T00:00:00`),
    });
    // الفترة 10:30–11:30 تتقاطع مع (10:45–12:15) المحسوبة بالفاصل، فتُستبعد؛ وكذلك 11:30–12:30 و 12:00-13:00
    expect(slots).not.toContain('10:30');
    expect(slots).not.toContain('11:00');
    expect(slots).not.toContain('11:30');
    expect(slots).not.toContain('12:00');
    expect(slots).toContain('09:00');
    expect(slots).toContain('12:30');
  });

  it('يستبعد فترة الاستراحة', () => {
    const slots = computeAvailableSlots({
      date: new Date(`${DAY}T00:00:00`),
      workingWindow: { ...baseWindow, breakStart: '13:00', breakEnd: '13:30' },
      durationMin: 30,
      slotMinutes: 30,
      bufferMinutes: 0,
      now: new Date(`${DAY}T00:00:00`),
    });
    expect(slots).not.toContain('13:00');
    expect(slots).toContain('12:30');
    expect(slots).toContain('13:30');
  });

  it('يعيد قائمة فارغة في يوم عطلة أو يوم دون دوام', () => {
    expect(
      computeAvailableSlots({
        date: new Date(`${DAY}T00:00:00`),
        workingWindow: baseWindow,
        isHoliday: true,
        durationMin: 30,
      }),
    ).toEqual([]);

    expect(
      computeAvailableSlots({
        date: new Date(`${DAY}T00:00:00`),
        workingWindow: null,
        durationMin: 30,
      }),
    ).toEqual([]);

    expect(
      computeAvailableSlots({
        date: new Date(`${DAY}T00:00:00`),
        workingWindow: { ...baseWindow, isClosed: true },
        durationMin: 30,
      }),
    ).toEqual([]);
  });

  it('يستبعد الأوقات التي مضت اليوم فقط', () => {
    const slots = computeAvailableSlots({
      date: new Date(`${DAY}T00:00:00`),
      workingWindow: baseWindow,
      durationMin: 30,
      slotMinutes: 30,
      bufferMinutes: 0,
      now: dateAt(DAY, '11:15'),
    });
    expect(slots).not.toContain('09:00');
    expect(slots).not.toContain('11:00');
    expect(slots).toContain('11:30');
  });

  it('لا يستبعد شيئاً بسبب "الآن" في يوم مختلف (يوم مستقبلي بالكامل متاح)', () => {
    const slots = computeAvailableSlots({
      date: new Date(`2026-09-25T00:00:00`),
      workingWindow: baseWindow,
      durationMin: 30,
      slotMinutes: 30,
      bufferMinutes: 0,
      now: dateAt(DAY, '16:00'),
    });
    expect(slots[0]).toBe('09:00');
  });

  it('لا يعيد فترة تتجاوز نهاية الدوام', () => {
    const slots = computeAvailableSlots({
      date: new Date(`${DAY}T00:00:00`),
      workingWindow: baseWindow,
      durationMin: 90,
      slotMinutes: 30,
      bufferMinutes: 0,
      now: new Date(`${DAY}T00:00:00`),
    });
    expect(slots[slots.length - 1]).toBe('15:30'); // 15:30 + 90 = 17:00 بالضبط
    expect(slots).not.toContain('16:00');
  });
});

describe('isSlotAvailable', () => {
  it('يتحقق من توفر وقت محدد ضمن القائمة المحسوبة', () => {
    const input = {
      date: new Date('2026-09-21T00:00:00'),
      workingWindow: { startTime: '09:00', endTime: '17:00' },
      durationMin: 30,
      slotMinutes: 30,
      bufferMinutes: 0,
      now: new Date('2026-09-21T00:00:00'),
      busy: [{ start: dateAt('2026-09-21', '10:00'), end: dateAt('2026-09-21', '10:30') }],
    };
    expect(isSlotAvailable(input, '09:30')).toBe(true);
    expect(isSlotAvailable(input, '10:00')).toBe(false);
  });
});
