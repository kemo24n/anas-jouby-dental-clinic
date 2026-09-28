import { describe, expect, it } from 'vitest';
import { sniffMime } from '@/lib/storage';
import { displayLocalPhone, normalizeSyrianMobile } from '@/lib/utils';
import { can } from '@/lib/permissions';

describe('sniffMime — التحقق من محتوى الملف الفعلي', () => {
  it('يتعرف على الصور وملفات PDF الحقيقية', () => {
    expect(sniffMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe('image/jpeg');
    expect(sniffMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe('image/png');
    expect(sniffMime(Buffer.from('RIFF\u0000\u0000\u0000\u0000WEBPVP8 ', 'binary'))).toBe('image/webp');
    expect(sniffMime(Buffer.from('%PDF-1.7\n'))).toBe('application/pdf');
  });

  it('يرفض HTML أو سكربت متنكّراً كصورة', () => {
    expect(sniffMime(Buffer.from('<html><script>alert(1)</script></html>'))).toBeNull();
    expect(sniffMime(Buffer.from('<svg onload="alert(1)"></svg>'))).toBeNull();
    expect(sniffMime(Buffer.alloc(0))).toBeNull();
  });
});

describe('displayLocalPhone', () => {
  it('يعرض رقم الموبايل السوري بصيغة محلية', () => {
    expect(displayLocalPhone('963944655028')).toBe('0944 655 028');
    expect(displayLocalPhone('+963 944 655 028')).toBe('0944 655 028');
  });
  it('يترك الأرقام الأخرى كما هي', () => {
    expect(displayLocalPhone('021 212 1859')).toBe('021 212 1859');
  });
});

describe('فصل الصلاحيات', () => {
  it('موظفة الاستقبال لا ترى المحتوى السريري ولا الملفات', () => {
    expect(can('RECEPTIONIST', 'clinical.read')).toBe(false);
    expect(can('RECEPTIONIST', 'files.write')).toBe(false);
  });
  it('المريض لا يملك أي صلاحية إدارية', () => {
    expect(can('PATIENT', 'patients.read')).toBe(false);
    expect(can('PATIENT', 'accounts.write')).toBe(false);
  });
});

describe('normalizeSyrianMobile — رقم الدخول', () => {
  it('يقبل 09XXXXXXXX ويخزّنه بصيغة 963', () => {
    expect(normalizeSyrianMobile('0944655028')).toBe('963944655028');
    expect(normalizeSyrianMobile('0944 655 028')).toBe('963944655028');
    expect(normalizeSyrianMobile('+963944655028')).toBe('963944655028');
    expect(normalizeSyrianMobile('00963944655028')).toBe('963944655028');
    expect(normalizeSyrianMobile('944655028')).toBe('963944655028');
  });
  it('يرفض الأرقام غير الصحيحة', () => {
    expect(normalizeSyrianMobile('021 212 1859')).toBeNull();
    expect(normalizeSyrianMobile('09446550')).toBeNull();
    expect(normalizeSyrianMobile('+96170123456')).toBeNull();
    expect(normalizeSyrianMobile('abc')).toBeNull();
    expect(normalizeSyrianMobile('')).toBeNull();
  });
});
