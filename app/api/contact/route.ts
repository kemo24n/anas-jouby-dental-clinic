import { prisma } from '@/lib/db';
import { contactSchema } from '@/lib/validation';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { clientIp, rateLimit } from '@/lib/rate-limit';

/** POST — نموذج التواصل العام. تُحفظ الرسالة وتظهر في لوحة التحكم. */
export async function POST(request: Request) {
  try {
    const limit = rateLimit(`contact:${clientIp(request)}`, 5, 10 * 60_000);
    if (!limit.allowed) return fail(ERROR_MESSAGES.tooManyRequests, 429);

    const body = contactSchema.parse(await request.json());
    await prisma.contactRequest.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        subject: body.subject,
        message: body.message,
      },
    });
    return ok({ received: true }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
