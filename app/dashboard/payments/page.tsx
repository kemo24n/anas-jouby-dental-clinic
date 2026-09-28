import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/components/dashboard/primitives';
import { PaymentsList } from '@/components/dashboard/payments-list';

export const metadata = { title: 'المدفوعات' };
export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const session = await requireRole('ADMIN', 'DENTIST', 'RECEPTIONIST');

  return (
    <div className="animate-rise">
      <PageHeader title="المدفوعات" description="سجل كل الدفعات المسجّلة في العيادة." />
      <PaymentsList canDelete={session.role === 'ADMIN'} />
    </div>
  );
}
