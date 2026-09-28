import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/components/dashboard/primitives';
import { ReportsView } from '@/components/dashboard/reports-view';

export const metadata = { title: 'التقارير' };
export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  await requireRole('ADMIN', 'DENTIST');

  return (
    <div className="animate-rise">
      <PageHeader title="التقارير" description="أداء العيادة خلال فترة محددة، مع إمكانية التصدير." />
      <ReportsView />
    </div>
  );
}
