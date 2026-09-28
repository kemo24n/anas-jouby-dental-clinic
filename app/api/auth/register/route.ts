import { prisma } from '@/lib/db';
import { hashPassword, passwordIssues } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { registerSchema } from '@/lib/validation';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { createPatientRecord } from '@/services/patients.service';
import { audit } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`register:${clientIp(request)}`, 5, 10 * 60_000);
    if (!limit.allowed) return fail(ERROR_MESSAGES.tooManyRequests, 429);

    const body = registerSchema.parse(await request.json());
    const issues = passwordIssues(body.password);
    if (issues.length) return fail(issues[0], 422);

    const email = body.email ? body.email.toLowerCase() : null;
    const existing = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (existing) return fail(ERROR_MESSAGES.phoneTaken, 409);
    if (email && (await prisma.user.findUnique({ where: { email } }))) return fail(ERROR_MESSAGES.emailTaken, 409);

    const user = await prisma.user.create({
      data: {
        email,
        phone: body.phone,
        passwordHash: await hashPassword(body.password),
        fullName: body.fullName,
        role: 'PATIENT',
      },
    });

    // أمان: لا يُربط الحساب الجديد تلقائياً بملف مريض موجود بنفس رقم الهاتف،
    // لأن ملكية الرقم غير مُثبتة، والربط كان سيكشف السجل الطبي لمن يعرف الرقم فقط.
    // يُنشأ ملف جديد، وتدمج العيادة الملفات عند الحاجة بعد التحقق من هوية المريض.
    const patient = await createPatientRecord({
      fullName: body.fullName,
      phone: body.phone,
      email: email ?? undefined,
      birthDate: body.birthDate || undefined,
      userId: user.id,
    });

    await createSession({ sub: user.id, role: 'PATIENT', name: user.fullName, patientId: patient.id, tv: user.tokenVersion });
    await audit({ userId: user.id, action: 'CREATE', entity: 'User', entityId: user.id, patientId: patient.id, description: 'إنشاء حساب مريض جديد', request });

    return ok({ redirectTo: '/portal' }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
