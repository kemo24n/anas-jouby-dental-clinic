import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/components/dashboard/primitives';
import { CasesList } from '@/components/dashboard/cases-list';

export const metadata = { title: 'الحالات' };
export const dynamic = 'force-dynamic';

export default async function CasesPage() {
  await requireRole('ADMIN', 'DENTIST');

  return (
    <div className="animate-rise">
      <PageHeader title="الحالات" description="كل الحالات السريرية المفتوحة والمغلقة عبر المرضى." />
      <CasesList />
    </div>
  );
}
