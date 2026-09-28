import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const ERROR_MESSAGES = {
  unexpected: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
  unauthorized: 'يجب تسجيل الدخول للمتابعة.',
  forbidden: 'لا يمكنك الوصول إلى هذا السجل.',
  notFound: 'العنصر المطلوب غير موجود.',
  slotTaken: 'هذا الموعد لم يعد متاحاً. يرجى اختيار وقت آخر.',
  invalidPhone: 'يرجى إدخال رقم هاتف صحيح.',
  emailTaken: 'هذا البريد الإلكتروني مستخدم بالفعل.',
  invalidCredentials: 'رقم الموبايل أو كلمة المرور غير صحيحة.',
  phoneTaken: 'هذا الرقم لديه حساب بالفعل. سجّل الدخول، أو تواصل مع العيادة إن نسيت كلمة المرور.',
  tooManyRequests: 'عدد كبير من المحاولات. يرجى الانتظار قليلاً ثم إعادة المحاولة.',
  validation: 'يرجى مراجعة البيانات المدخلة.',
  mustChangePassword: 'يجب تغيير كلمة المرور المؤقتة قبل المتابعة.',
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** يحوّل أخطاء zod إلى رسائل عربية مرتبطة بالحقول. */
export function zodFail(error: ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.errors) {
    fieldErrors[issue.path.join('.') || '_'] = issue.message;
  }
  return fail(ERROR_MESSAGES.validation, 422, { fieldErrors });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) return zodFail(error);
  const code = (error as { code?: string })?.code;
  if (code === 'P2002') return fail('هذه القيمة مسجّلة مسبقاً.', 409);
  if (code === 'P2025') return fail(ERROR_MESSAGES.notFound, 404);
  if (code === 'P2003' || code === 'P2023') return fail(ERROR_MESSAGES.validation, 422);
  console.error('[api]', error);
  return fail(ERROR_MESSAGES.unexpected, 500);
}
