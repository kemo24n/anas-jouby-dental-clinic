import { prisma } from '@/lib/db';
import { destroySession, getSession } from '@/lib/auth/session';
import { ok } from '@/lib/api';

/** تسجيل الخروج يُبطل الرمز على الخادم أيضاً، فلا يصلح استخدامه مجدداً حتى لو نُسخ. */
export async function POST() {
  const session = await getSession();
  if (session) {
    await prisma.user
      .update({ where: { id: session.sub }, data: { tokenVersion: { increment: 1 } } })
      .catch(() => undefined);
  }
  await destroySession();
  return ok({ redirectTo: '/' });
}
