'use client';
import { DeleteButton } from '@/components/dashboard/delete-button';

import * as React from 'react';
import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/field';
import { EmptyState, ErrorNote, SkeletonRows } from '@/components/ui/states';
import { TableWrap, Td, Th } from '@/components/dashboard/primitives';
import { itemStatusLabels, planStatusLabels } from '@/lib/labels';
import { formatMoney, formatShortDate } from '@/lib/utils';
import type { TreatmentPlanStatus } from '@prisma/client';

type PlanRow = {
  id: string;
  title: string;
  status: TreatmentPlanStatus;
  createdAt: string;
  patient: { id: string; code: string; fullName: string };
  items: { id: string; procedure: string; estimatedCost: number; actualCost: number | null; status: keyof typeof itemStatusLabels }[];
};

export function TreatmentPlansList() {
  const [statusFilter, setStatusFilter] = React.useState<'' | TreatmentPlanStatus>('');
  const [rows, setRows] = React.useState<PlanRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRows(null);
    setError(null);
    fetch('/api/treatment-plans')
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok) {
          setError(payload.error ?? 'تعذر تحميل خطط العلاج.');
          setRows([]);
          return;
        }
        setRows(
          payload.data.map((plan: PlanRow & { items: { estimatedCost: string | number; actualCost: string | number | null }[] }) => ({
            ...plan,
            items: plan.items.map((item) => ({ ...item, estimatedCost: Number(item.estimatedCost), actualCost: item.actualCost === null ? null : Number(item.actualCost) })),
          })),
        );
      })
      .catch(() => {
        setError('تعذر الاتصال بالخادم.');
        setRows([]);
      });
  }, []);

  const filtered = React.useMemo(
    () => (rows ?? []).filter((row) => !statusFilter || row.status === statusFilter),
    [rows, statusFilter],
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Select
          aria-label="تصفية حسب الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TreatmentPlanStatus | '')}
          className="h-10 w-48 py-0 pl-8"
        >
          <option value="">كل الحالات</option>
          {Object.entries(planStatusLabels).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </Select>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {rows === null && <SkeletonRows rows={6} />}

      {rows !== null && filtered.length === 0 && !error && (
        <EmptyState icon={<ListChecks size={28} />} title="لا توجد خطط علاج" description="تُنشأ خطط العلاج من داخل ملف كل مريض." />
      )}

      {filtered.map((plan) => {
        const total = plan.items.reduce((sum, item) => sum + (item.actualCost ?? item.estimatedCost), 0);
        return (
          <Card key={plan.id}>
            <CardHeader
              title={plan.title}
              description={`${plan.patient.fullName} · ${formatShortDate(plan.createdAt)} · الإجمالي ${formatMoney(total)}`}
              action={
                <div className="flex items-center gap-1">
                  <Badge className="border-orchid-200 bg-orchid-50 text-orchid-700">{planStatusLabels[plan.status]}</Badge>
                  <DeleteButton
                    endpoint={`/api/treatment-plans/${plan.id}`}
                    title="حذف خطة العلاج"
                    message={`سيتم حذف خطة «${plan.title}» من ملف ${plan.patient.fullName}.`}
                    onDeleted={() => setRows((prev) => (prev ?? []).filter((r) => r.id !== plan.id))}
                  />
                </div>
              }
            />
            <TableWrap>
              <thead>
                <tr>
                  <Th>الإجراء</Th>
                  <Th>التكلفة</Th>
                  <Th>الحالة</Th>
                </tr>
              </thead>
              <tbody>
                {plan.items.map((item) => (
                  <tr key={item.id}>
                    <Td>{item.procedure}</Td>
                    <Td className="tabular-nums">{formatMoney(item.actualCost ?? item.estimatedCost)}</Td>
                    <Td className="text-muted">{itemStatusLabels[item.status]}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <div className="border-t border-line px-5 py-3">
              <Link href={`/dashboard/patients/${plan.patient.id}`} className="text-sm text-orchid-600 hover:underline">
                فتح ملف المريض
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
