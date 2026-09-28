import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { getPatientBalance } from '@/services/patients.service';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/states';
import { TableWrap, Td, Th } from '@/components/dashboard/primitives';
import { itemStatusLabels, planStatusLabels } from '@/lib/labels';
import { formatMoney, formatShortDate } from '@/lib/utils';

export const metadata = { title: 'خطتي العلاجية' };
export const dynamic = 'force-dynamic';

export default async function PortalPlanPage() {
  const session = await requireRole('PATIENT');
  if (!session.patientId) return <EmptyState title="لا يوجد ملف مريض مرتبط بحسابك" />;

  const [plans, balance] = await Promise.all([
    prisma.treatmentPlan.findMany({
      where: { patientId: session.patientId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    }),
    getPatientBalance(session.patientId),
  ]);

  return (
    <div className="animate-rise space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="card px-5 py-4">
          <p className="text-sm text-muted">إجمالي العلاجات</p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{formatMoney(balance.charged)}</p>
        </div>
        <div className="card px-5 py-4">
          <p className="text-sm text-muted">المدفوع</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-ok">{formatMoney(balance.paid)}</p>
        </div>
        <div className="card px-5 py-4">
          <p className="text-sm text-muted">الرصيد المتبقي</p>
          <p className={`mt-2 text-xl font-semibold tabular-nums ${balance.balance > 0 ? 'text-danger' : ''}`}>
            {formatMoney(balance.balance)}
          </p>
        </div>
      </div>

      {plans.length === 0 ? (
        <EmptyState title="لا توجد خطة علاج بعد" description="ستظهر هنا خطة علاجك بمجرد أن تُنشئها الطبيبة." />
      ) : (
        plans.map((plan) => {
          const total = plan.items.reduce((sum, item) => sum + Number(item.actualCost ?? item.estimatedCost), 0);
          return (
            <Card key={plan.id}>
              <CardHeader
                title={plan.title}
                description={`أُنشئت في ${formatShortDate(plan.createdAt)} · الإجمالي ${formatMoney(total)}`}
                action={<Badge className="border-orchid-200 bg-orchid-50 text-orchid-700">{planStatusLabels[plan.status]}</Badge>}
              />
              <TableWrap>
                <thead>
                  <tr>
                    <Th>الإجراء</Th>
                    <Th>السن</Th>
                    <Th>التكلفة</Th>
                    <Th>الحالة</Th>
                  </tr>
                </thead>
                <tbody>
                  {plan.items.map((item) => (
                    <tr key={item.id}>
                      <Td>{item.procedure}</Td>
                      <Td className="text-muted">{item.toothNumber ?? '—'}</Td>
                      <Td className="tabular-nums">{formatMoney(Number(item.actualCost ?? item.estimatedCost))}</Td>
                      <Td className="text-muted">{itemStatusLabels[item.status]}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Card>
          );
        })
      )}
    </div>
  );
}
