/**
 * الوسائط.
 * - صور العيادة الحقيقية محفوظة محلياً في public/images (صالة الانتظار وغرفتا المعالجة).
 * عند وصول صورة شخصية للطبيبة أو صور قبل/بعد: ضعها في public/images وعدّل هذا الملف.
 */

export const MEDIA = {
  waiting: '/images/waiting-room.jpg', // صالة الانتظار والاستقبال
  room: '/images/treatment-room.jpg', // غرفة المعالجة
  roomAlt: '/images/treatment-room-2.jpg', // غرفة المعالجة من زاوية ثانية
  // لا توجد صورة شخصية للطبيبة بعد — تُستخدم صورة غرفة المعالجة مكانها
  doctor: null as string | null,
  video: {
    // مقطع مجاني من Mixkit (بدون علامة مائية): طبيبة أسنان تفحص مريضة — نفس مقطع عيادة د. سنا
    hero: 'https://assets.mixkit.co/videos/6428/6428-720.mp4',
    heroFallback: 'https://assets.mixkit.co/videos/6428/6428-360.mp4',
  },
};

/**
 * صور الخدمات (اختيارية): ضع الصورة في public/images/services/<slug>.jpg ثم أضف السطر هنا.
 * لا تُستخدم صور من مواقع خارجية حتى لا يظهر للزائر مكان لا يخص العيادة.
 */
export const SERVICE_IMAGES: Record<string, string> = {};

export const GALLERY = [
  { src: MEDIA.room, alt: 'غرفة المعالجة في العيادة' },
  { src: MEDIA.waiting, alt: 'صالة الانتظار والاستقبال' },
  { src: MEDIA.roomAlt, alt: 'غرفة المعالجة من زاوية أخرى' },
];
