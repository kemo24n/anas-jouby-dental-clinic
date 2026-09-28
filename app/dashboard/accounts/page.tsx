import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/components/dashboard/primitives';
import { AccountsManager } from '@/components/dashboard/accounts-manager';

export const metadata = { title: 'حسابات المرضى' };
export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  await requireRole('ADMIN');

  return (
    <div className="animate-rise">
      <PageHeader
        title="حسابات المرضى"
        description="الحسابات التي يدخل بها المرضى إلى بوابتهم برقم الموبايل: إعادة تعيين كلمة المرور، الإيقاف، أو الحذف."
      />
      <AccountsManager />
    </div>
  );
}
