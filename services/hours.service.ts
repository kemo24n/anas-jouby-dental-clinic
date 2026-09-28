import { prisma } from '@/lib/db';

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
// ترتيب العرض يبدأ من السبت كما هو معتاد في سوريا
const DISPLAY_ORDER = [6, 0, 1, 2, 3, 4, 5];

function to12h(time: string) {
  const [h, m] = time.split(':').map(Number);
  const suffix = h < 12 ? 'صباحاً' : 'مساءً';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, '0')} ${suffix}` : `${hour} ${suffix}`;
}

export type HoursLine = { days: string; hours: string; closed: boolean };

/**
 * ملخص ساعات الدوام كما تُدخل في لوحة التحكم، مع دمج الأيام المتشابهة.
 * يُستخدم في التذييل وصفحة التواصل حتى لا تُكتب الساعات يدوياً في أكثر من مكان.
 */
export async function getHoursSummary(): Promise<HoursLine[]> {
  const dentist = await prisma.dentist.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    include: { workingHours: true },
  });
  if (!dentist) return [];

  const byDay = new Map(dentist.workingHours.map((w) => [w.weekday, w]));
  const groups: { label: string; days: number[] }[] = [];

  for (const day of DISPLAY_ORDER) {
    const w = byDay.get(day);
    const label = !w || w.isClosed ? 'CLOSED' : `${to12h(w.startTime)} – ${to12h(w.endTime)}`;
    const existing = groups.find((g) => g.label === label);
    if (existing) existing.days.push(day);
    else groups.push({ label, days: [day] });
  }

  const open = groups.filter((g) => g.label !== 'CLOSED');
  const closed = groups.filter((g) => g.label === 'CLOSED');

  // الحالة الشائعة: دوام واحد لكل أيام العمل → سطر واحد مختصر
  if (open.length === 1 && closed.length === 1) {
    const off = closed[0].days.map((d) => DAY_NAMES[d]).join(' و');
    return [{ days: `يومياً ما عدا ${off}`, hours: open[0].label, closed: false }];
  }

  return [
    ...open.map((g) => ({ days: g.days.map((d) => DAY_NAMES[d]).join('، '), hours: g.label, closed: false })),
    ...closed.map((g) => ({ days: g.days.map((d) => DAY_NAMES[d]).join(' و'), hours: 'عطلة', closed: true })),
  ];
}

/** صيغة schema.org لساعات الدوام */
export async function getOpeningHoursSpec(): Promise<string[]> {
  const codes = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dentist = await prisma.dentist.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    include: { workingHours: true },
  });
  if (!dentist) return [];
  return dentist.workingHours
    .filter((w) => !w.isClosed)
    .sort((a, b) => a.weekday - b.weekday)
    .map((w) => `${codes[w.weekday]} ${w.startTime}-${w.endTime}`);
}
