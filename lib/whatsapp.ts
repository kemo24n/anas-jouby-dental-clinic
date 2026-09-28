import { PUBLIC_WHATSAPP } from './env';
import { BRAND } from './brand';

/**
 * توليد روابط واتساب.
 * تحذير أمني: لا تُمرَّر أي معلومات طبية أو سجلات مرضى داخل نص الرابط،
 * لأن الروابط تُسجَّل في المتصفح وسجلات الخوادم الوسيطة.
 */
export function whatsappLink(message: string, number: string = PUBLIC_WHATSAPP) {
  const clean = number.replace(/[^\d]/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export const WA_MESSAGES = {
  general: `مرحباً، أود الاستفسار عن خدمات ${BRAND.shortClinicName}.`,
  booking: `مرحباً، أود حجز موعد في ${BRAND.shortClinicName}.`,
  confirmAppointment: (code: string) =>
    `مرحباً، أود تأكيد الموعد رقم ${code} في ${BRAND.shortClinicName}.`,
  reminder: (code: string) =>
    `تذكير بموعدكم رقم ${code} في ${BRAND.shortClinicName}. للتأكيد أو التعديل يرجى الرد على هذه الرسالة.`,
  contactPatient: () => `مرحباً، معكم ${BRAND.shortClinicName}. نود التواصل معكم بخصوص موعدكم.`,
};
