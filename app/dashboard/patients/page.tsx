import { requireRole } from '@/lib/auth/session';
import { can } from '@/lib/permissions';
import { PageHeader } from '@/components/dashboard/primitives';
import { PatientsTable } from '@/components/dashboard/patients-table';

export const metadata = { title: 'المرضى' };
export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
  const session = await requireRole('ADMIN', 'DENTIST', 'RECEPTIONIST');

  return (
    <div className="animate-rise">
      <PageHeader title="المرضى" description="سجل المرضى المسجّلين في العيادة." />
      <PatientsTable canWrite={can(session.role, 'patients.write')} canDelete={can(session.role, 'patients.delete')} />
    </div>
  );
}
