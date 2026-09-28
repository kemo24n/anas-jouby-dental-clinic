import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/components/dashboard/primitives';
import { ServicesManager } from '@/components/dashboard/services-manager';

export const metadata = { title: 'الخدمات' };
export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  await requireRole('ADMIN');

  return (
    <div className="animate-rise">
      <PageHeader title="الخدمات" description="إدارة خدمات العيادة المعروضة على الموقع العام." />
      <ServicesManager />
    </div>
  );
}
