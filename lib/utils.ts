import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AR_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const AR_MONTHS = [
  'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
  'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول',
];

/** التاريخ بصيغة عربية واضحة: الإثنين 21 أيلول 2026 */
export function formatArabicDate(value: Date | string) {
  const d = typeof value === 'string' ? new Date(value) : value;
  return `${AR_DAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShortDate(value: Date | string) {
  const d = typeof value === 'string' ? new Date(value) : value;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** الوقت بصيغة 12 ساعة عربية: 09:30 صباحاً */
export function formatArabicTime(value: Date | string) {
  const d = typeof value === 'string' ? new Date(value) : value;
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const suffix = h < 12 ? 'صباحاً' : 'مساءً';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${m} ${suffix}`;
}

export function formatMoney(amount: number | string | null | undefined, currency = 'USD') {
  const value = Number(amount ?? 0);
  const symbol = currency === 'USD' ? '$' : currency === 'SYP' ? 'ل.س' : currency;
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${symbol}`;
}

export function calcAge(birthDate: Date | string | null | undefined) {
  if (!birthDate) return null;
  const d = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export function initials(name: string) {
  return name.replace(/^(د\.|أ\.)\s*/, '').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('');
}

/** توحيد أرقام الهواتف السورية واللبنانية والدولية إلى صيغة E.164 بدون + */
export function normalizePhone(input: string): string {
  let p = input.replace(/[\s\-()]/g, '').replace(/^\+/, '').replace(/^00/, '');
  if (/^0\d{8,10}$/.test(p)) p = `963${p.slice(1)}`; // افتراض محلي: سوريا
  return p;
}

export function isValidPhone(input: string): boolean {
  return /^\d{9,15}$/.test(normalizePhone(input));
}

/**
 * رقم موبايل سوري للدخول: يقبل 09XXXXXXXX (الطريقة المعتادة) ويقبل أيضاً +963/00963.
 * يُعيد الصيغة المخزّنة 9639XXXXXXXX، أو null إن لم يكن رقم موبايل سورياً صحيحاً.
 */
export function normalizeSyrianMobile(input: string): string | null {
  const digits = (input ?? '').replace(/[\s\-()+]/g, '').replace(/^00/, '');
  let local = digits;
  if (/^963\d{9}$/.test(local)) local = `0${local.slice(3)}`;
  if (/^9\d{8}$/.test(local)) local = `0${local}`;
  if (!/^09\d{8}$/.test(local)) return null;
  return `963${local.slice(1)}`;
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** عرض رقم سوري دولي (963944655028) بصيغة محلية مقروءة: 0944 655 028 */
export function displayLocalPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, '');
  const local = digits.startsWith('963') ? `0${digits.slice(3)}` : digits;
  if (/^09\d{8}$/.test(local)) return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  return input;
}
