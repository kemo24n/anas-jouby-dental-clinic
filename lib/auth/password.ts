import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

const ROUNDS = 12;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/** سياسة كلمة المرور: 8 أحرف على الأقل مع حرف ورقم */
export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push('يجب ألا تقل كلمة المرور عن 8 أحرف.');
  if (!/[A-Za-z\u0600-\u06FF]/.test(password)) issues.push('يجب أن تحتوي كلمة المرور على حرف واحد على الأقل.');
  if (!/\d/.test(password)) issues.push('يجب أن تحتوي كلمة المرور على رقم واحد على الأقل.');
  return issues;
}

/** كلمة مرور مؤقتة سهلة القراءة للإملاء على المريض (بدون أحرف متشابهة). */
export function tempPassword() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(10);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${out.slice(0, 5)}-${out.slice(5)}7`;
}
