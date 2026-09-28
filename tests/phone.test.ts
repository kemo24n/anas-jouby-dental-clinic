import { describe, expect, it } from 'vitest';
import { isValidPhone, normalizePhone } from '@/lib/utils';

describe('normalizePhone', () => {
  it('يحوّل رقماً سورياً محلياً إلى صيغة دولية بدون +', () => {
    expect(normalizePhone('0997128298')).toBe('963997128298');
    expect(normalizePhone('0999123456')).toBe('963999123456');
  });

  it('يزيل الرمز + وبادئة 00 الدولية', () => {
    expect(normalizePhone('+963997128298')).toBe('963997128298');
    expect(normalizePhone('00963997128298')).toBe('963997128298');
  });

  it('يزيل المسافات والشرطات والأقواس', () => {
    expect(normalizePhone('+963 997 128 298')).toBe('963997128298');
    expect(normalizePhone('0997-128-298')).toBe('963997128298');
    expect(normalizePhone('(0997) 128 298')).toBe('963997128298');
  });

  it('يترك الأرقام الدولية غير السورية دون تغيير جوهري (بعد إزالة الرموز)', () => {
    expect(normalizePhone('+96170123456')).toBe('96170123456'); // لبنان
    expect(normalizePhone('+14155552671')).toBe('14155552671'); // أمريكي
  });
});

describe('isValidPhone', () => {
  it('يقبل أرقاماً سورية ودولية صحيحة الطول', () => {
    expect(isValidPhone('0997128298')).toBe(true);
    expect(isValidPhone('+963997128298')).toBe(true);
    expect(isValidPhone('+96170123456')).toBe(true);
  });

  it('يرفض أرقاماً قصيرة جداً أو تحتوي أحرفاً', () => {
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('abc123')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });
});
