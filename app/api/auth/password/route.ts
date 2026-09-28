import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword, passwordIssues, verifyPassword } from '@/lib/auth/password';
import { requireAuth } from '@/lib/guard';
import { createSession } from '@/lib/auth/session';
import { rateLimit } from '@/lib/rate-limit';
import { fail, handleRouteError, ok } from '@/lib/api';
import { audit } from '@/lib/audit';

const schema = z.object({
  currentPassword: z.string().min(1, 'يرجى إدخال كلمة المرور الحالية.'),
  newPassword: z.string().min(8, 'يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف.'),
});

export async function POST(request: Request) {
  try {
    const { session, response } = await requireAuth({ allowMustChangePassword: true });
    if (response) return response;

    const limit = rateLimit(`password:${session.sub}`, 6, 15 * 60_000);
    if (!limit.allowed) return fail('عدد كبير من المحاولات. يرجى الانتظار قليلاً.', 429);

    const body = schema.parse(await request.json());
    const issues = passwordIssues(body.newPassword);
    if (issues.length) return fail(issues[0], 422);

    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user || !(await verifyPassword(body.currentPassword, user.passwordHash))) {
      return fail('كلمة المرور الحالية غير صحيحة.', 400);
    }

    if (body.newPassword === body.currentPassword) {
      return fail('يجب أن تختلف كلمة المرور الجديدة عن الحالية.', 422);
    }

    // زيادة نسخة الرمز تُخرج كل الأجهزة الأخرى، ثم نصدر جلسة جديدة لهذا الجهاز
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(body.newPassword),
        mustChangePassword: false,
        tokenVersion: { increment: 1 },
      },
    });
    await createSession({
      sub: session.sub,
      role: session.role,
      name: session.name,
      patientId: session.patientId,
      dentistId: session.dentistId,
      tv: updated.tokenVersion,
    });
    await audit({ userId: user.id, action: 'UPDATE', entity: 'User', entityId: user.id, description: 'تغيير كلمة المرور', request });

    return ok({ changed: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
