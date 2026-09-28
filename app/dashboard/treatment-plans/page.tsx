import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/components/dashboard/primitives';
import { TreatmentPlansList } from '@/components/dashboard/treatment-plans-list';

export const metadata = { title: 'خطط العلاج' };
export const dynamic = 'force-dynamic';

export default async function TreatmentPlansPage() {
  await requireRole('ADMIN', 'DENTIST');

  return (
    <div className="animate-rise">
      <PageHeader title="خطط العلاج" description="كل خطط العلاج المسجّلة عبر المرضى." />
      <TreatmentPlansList />
    </div>
  );
}
