import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/components/dashboard/primitives';
import { ClinicalRecordsFeed } from '@/components/dashboard/clinical-records-feed';

export const metadata = { title: 'الملفات الطبية' };
export const dynamic = 'force-dynamic';

export default async function RecordsPage() {
  await requireRole('ADMIN', 'DENTIST');

  return (
    <div className="animate-rise">
      <PageHeader title="الملفات الطبية" description="أحدث الملاحظات السريرية المسجّلة عبر جميع المرضى." />
      <ClinicalRecordsFeed />
    </div>
  );
}
