import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/components/dashboard/primitives';
import { ClinicSettingsForm } from '@/components/dashboard/clinic-settings-form';

export const metadata = { title: 'إعدادات العيادة' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireRole('ADMIN');

  return (
    <div className="animate-rise max-w-3xl">
      <PageHeader title="إعدادات العيادة" description="بيانات العيادة، واجهة الموقع، وساعات الدوام." />
      <ClinicSettingsForm />
    </div>
  );
}
