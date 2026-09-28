import type { Metadata } from 'next';
import { requireSession } from '@/lib/auth/session';
import { ChangePasswordForm } from '@/components/auth/change-password-form';

export const metadata: Metadata = {
  title: 'تغيير كلمة المرور',
  robots: { index: false, follow: false },
};

export default async function ChangePasswordPage() {
  const session = await requireSession({ allowMustChangePassword: true });
  return <ChangePasswordForm redirectTo={session.role === 'PATIENT' ? '/portal' : '/dashboard'} />;
}
