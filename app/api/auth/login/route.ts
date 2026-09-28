import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { loginSchema } from '@/lib/validation';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { audit } from '@/lib/audit';

// تجزئة bcrypt وهمية تُقارَن عند عدم وجود المستخدم، حتى يتساوى زمن الاستجابة
// ولا يمكن معرفة البريد المسجّل من توقيت الرد.
const DUMMY_HASH = '$2a$12$FvgqyCf6WRVGgOZ08D26veg.jS48OiJgXWYuHudSvGuFjj3lhxctG';

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const byIp = rateLimit(`login:ip:${ip}`, 10, 5 * 60_000);
    if (!byIp.allowed) return fail(ERROR_MESSAGES.tooManyRequests, 429);

    const parsed = loginSchema.safeParse(await request.json());
    // رقم بصيغة خاطئة يأخذ نفس الرسالة العامة
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? ERROR_MESSAGES.invalidCredentials, 422);
    const body = parsed.data;

    // حد لكل حساب لمنع تخمين كلمة المرور من عناوين متعددة
    const byAccount = rateLimit(`login:acct:${body.phone}`, 8, 15 * 60_000);
    if (!byAccount.allowed) return fail(ERROR_MESSAGES.tooManyRequests, 429);

    const user = await prisma.user.findUnique({
      where: { phone: body.phone },
      include: { patient: { select: { id: true } }, dentist: { select: { id: true } } },
    });

    const passwordOk = await verifyPassword(body.password, user?.passwordHash ?? DUMMY_HASH);

    // رسالة واحدة لكل الحالات حتى لا نكشف وجود البريد من عدمه
    if (!user || !user.isActive || !passwordOk) {
      if (user) {
        await audit({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id, description: 'محاولة دخول فاشلة', request });
      }
      return fail(ERROR_MESSAGES.invalidCredentials, 401);
    }

    await createSession({
      sub: user.id,
      role: user.role,
      name: user.fullName,
      patientId: user.patient?.id,
      dentistId: user.dentist?.id,
      tv: user.tokenVersion,
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await audit({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id, description: 'تسجيل دخول ناجح', request });

    return ok({
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      redirectTo: user.role === 'PATIENT' ? '/portal' : '/dashboard',
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
