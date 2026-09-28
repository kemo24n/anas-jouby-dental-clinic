import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@prisma/client';

export const JWT_ISSUER = 'anas-jouby-dental';

export type SessionPayload = {
  sub: string; // معرّف المستخدم
  role: Role;
  name: string;
  patientId?: string;
  dentistId?: string;
  tv: number; // نسخة الرمز — تُطابَق مع قاعدة البيانات لإبطال الجلسات
};

const PLACEHOLDER = 'replace-with-a-long-random-secret';

/** المفتاح السري. في الإنتاج يجب أن يكون 32 حرفاً على الأقل وألا يكون القيمة المثالية. */
export function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith(PLACEHOLDER)) {
    throw new Error('AUTH_SECRET غير معرّف أو ضعيف. ولّد مفتاحاً عبر: openssl rand -base64 48');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload, maxAgeSeconds: number) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: JWT_ISSUER, algorithms: ['HS256'] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
