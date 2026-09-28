import type { Role } from '@prisma/client';
import { getSession, type Session } from './auth/session';
import { can, type Permission } from './permissions';
import { ERROR_MESSAGES, fail } from './api';

type GuardResult = { session: Session; response?: never } | { session?: never; response: Response };

/** يتحقق من الجلسة والصلاحية داخل مسارات الـ API. التحقق دائماً على الخادم. */
export async function guard(permission?: Permission, roles?: Role[]): Promise<GuardResult> {
  const session = await getSession();
  if (!session) return { response: fail(ERROR_MESSAGES.unauthorized, 401) };
  if (session.mustChangePassword) return { response: fail(ERROR_MESSAGES.mustChangePassword, 403) };
  if (roles && !roles.includes(session.role)) return { response: fail(ERROR_MESSAGES.forbidden, 403) };
  if (permission && !can(session.role, permission)) return { response: fail(ERROR_MESSAGES.forbidden, 403) };
  return { session };
}

/**
 * أي مستخدم مسجّل. افتراضياً يُمنع من لم يغيّر كلمة المرور المؤقتة بعد،
 * باستثناء المسارات اللازمة لتغييرها (allowMustChangePassword).
 */
export async function requireAuth(options: { allowMustChangePassword?: boolean } = {}): Promise<GuardResult> {
  const session = await getSession();
  if (!session) return { response: fail(ERROR_MESSAGES.unauthorized, 401) };
  if (session.mustChangePassword && !options.allowMustChangePassword) {
    return { response: fail(ERROR_MESSAGES.mustChangePassword, 403) };
  }
  return { session };
}
