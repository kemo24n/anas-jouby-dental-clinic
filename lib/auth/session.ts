import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Role } from '@prisma/client';
import { prisma } from '../db';
import { env } from '../env';
import { signSession, verifySession, type SessionPayload } from './jwt';

export type Session = SessionPayload & { mustChangePassword: boolean };

export async function createSession(payload: SessionPayload) {
  const token = await signSession(payload, env.sessionMaxAge);
  (await cookies()).set(env.cookieName, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: env.sessionMaxAge,
  });
}

export async function destroySession() {
  (await cookies()).set(env.cookieName, '', { httpOnly: true, secure: env.isProduction, sameSite: 'lax', path: '/', maxAge: 0 });
}

/**
 * الجلسة الحالية أو null.
 * لا يُكتفى بتوقيع الرمز: يُتحقق من قاعدة البيانات أن الحساب ما زال فعّالاً،
 * وأن الدور لم يتغير، وأن الرمز لم يُبطَل (تغيير كلمة المرور، الإيقاف، تسجيل الخروج).
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(env.cookieName)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { isActive: true, role: true, tokenVersion: true, mustChangePassword: true },
  });
  if (!user || !user.isActive || user.role !== payload.role || user.tokenVersion !== (payload.tv ?? -1)) {
    return null;
  }
  return { ...payload, mustChangePassword: user.mustChangePassword };
});

/** يفرض وجود جلسة، وإلا يعيد التوجيه لصفحة الدخول. يفرض تغيير كلمة المرور المؤقتة أولاً. */
export async function requireSession(options: { allowMustChangePassword?: boolean } = {}): Promise<Session> {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.mustChangePassword && !options.allowMustChangePassword) redirect('/change-password');
  return session;
}

/** يفرض دوراً معيناً — التحقق يتم على الخادم دائماً، لا بالإخفاء في الواجهة فقط. */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await requireSession();
  if (!roles.includes(session.role)) redirect('/403');
  return session;
}
