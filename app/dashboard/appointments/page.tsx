import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';
import { PageHeader } from '@/components/dashboard/primitives';
import { AppointmentsBoard } from '@/components/dashboard/appointments-board';

export const metadata = { title: 'المواعيد' };
export const dynamic = 'force-dynamic';

export default async function AppointmentsPage() {
  const session = await requireRole('ADMIN', 'DENTIST', 'RECEPTIONIST');

  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, durationMin: true },
  });

  return (
    <div className="animate-rise">
      <PageHeader title="المواعيد" description="تقويم العيادة: اليوم، الأسبوع، الشهر، أو قائمة كاملة." />
      <AppointmentsBoard services={services} canWrite={can(session.role, 'appointments.write')} />
    </div>
  );
}
