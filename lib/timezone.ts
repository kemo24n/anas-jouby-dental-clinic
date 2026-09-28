/**
 * كل حسابات المواعيد (أيام الدوام، الأوقات المتاحة، التقارير) تتم بتوقيت العيادة.
 * الاستضافات السحابية (Netlify / Vercel) تعمل بتوقيت UTC، لذلك نثبّت المنطقة الزمنية هنا
 * قبل أي عملية على التواريخ. Node يطبّق التغيير فوراً عند تعديل process.env.TZ.
 */
export const CLINIC_TIMEZONE = 'Asia/Damascus';

if (typeof process !== 'undefined' && process.env && process.env.TZ !== CLINIC_TIMEZONE) {
  process.env.TZ = CLINIC_TIMEZONE;
}
