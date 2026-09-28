import { requireSession } from '@/lib/auth/session';
import { PageHeader } from '@/components/dashboard/primitives';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { roleLabels } from '@/lib/labels';

export const metadata = { title: 'إعدادات الحساب' };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const session = await requireSession();

  return (
    <div className="animate-rise max-w-lg space-y-6">
      <PageHeader title="إعدادات الحساب" />

      <Card>
        <CardHeader title="بيانات الحساب" />
        <CardBody className="space-y-2 text-sm">
          <p>
            <span className="text-muted">الاسم: </span>
            {session.name}
          </p>
          <p>
            <span className="text-muted">الدور: </span>
            {roleLabels[session.role]}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="تغيير كلمة المرور" />
        <CardBody>
          <ChangePasswordForm redirectTo="/dashboard/account" />
        </CardBody>
      </Card>
    </div>
  );
}
