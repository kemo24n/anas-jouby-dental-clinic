'use client';

import * as React from 'react';
import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorNote, SkeletonRows } from '@/components/ui/states';
import { TableWrap, Td, Th } from '@/components/dashboard/primitives';
import { paymentMethodLabels } from '@/lib/labels';
import { formatMoney, formatShortDate } from '@/lib/utils';
import type { PaymentMethod } from '@prisma/client';
import { DeleteButton } from '@/components/dashboard/delete-button';

type PaymentRow = {
  id: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  notes: string | null;
  patient: { id: string; code: string; fullName: string };
};

export function PaymentsList({ canDelete = false }: { canDelete?: boolean }) {
  const [rows, setRows] = React.useState<PaymentRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    fetch('/api/payments')
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok) {
          setError(payload.error ?? 'تعذر تحميل المدفوعات.');
          setRows([]);
          return;
        }
        setRows(payload.data.map((row: PaymentRow & { amount: string | number }) => ({ ...row, amount: Number(row.amount) })));
      })
      .catch(() => {
        setError('تعذر الاتصال بالخادم.');
        setRows([]);
      });
  }, [reloadKey]);

  const total = React.useMemo(() => (rows ?? []).reduce((sum, row) => sum + row.amount, 0), [rows]);

  return (
    <div className="space-y-5">
      {error && <ErrorNote>{error}</ErrorNote>}
      {rows === null && <SkeletonRows rows={8} />}

      {rows !== null && rows.length === 0 && !error && (
        <EmptyState icon={<Wallet size={28} />} title="لا توجد مدفوعات مسجّلة" description="تُسجَّل المدفوعات من داخل ملف كل مريض." />
      )}

      {rows !== null && rows.length > 0 && (
        <Card>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <p className="text-sm font-medium">آخر {rows.length} دفعة</p>
            <p className="text-sm text-muted">
              الإجمالي: <b className="text-ink">{formatMoney(total)}</b>
            </p>
          </div>
          <TableWrap>
            <thead>
              <tr>
                <Th>التاريخ</Th>
                <Th>المريض</Th>
                <Th>المبلغ</Th>
                <Th>الطريقة</Th>
                <Th>ملاحظات</Th>
                {canDelete && <Th className="w-10"><span className="sr-only">حذف</span></Th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <Td>{formatShortDate(row.paidAt)}</Td>
                  <Td>
                    <Link href={`/dashboard/patients/${row.patient.id}`} className="hover:text-orchid-600">
                      {row.patient.fullName}
                    </Link>
                  </Td>
                  <Td className="tabular-nums font-medium">{formatMoney(row.amount)}</Td>
                  <Td className="text-muted">{paymentMethodLabels[row.method]}</Td>
                  <Td className="text-muted">{row.notes ?? '—'}</Td>
                  {canDelete && (
                    <Td>
                      <DeleteButton
                        endpoint={`/api/payments/${row.id}`}
                        title="حذف الدفعة"
                        message={`سيتم حذف دفعة ${row.patient.fullName} بقيمة ${formatMoney(row.amount)} نهائياً، وسيتغير رصيد المريض.`}
                        onDeleted={() => setReloadKey((k) => k + 1)}
                      />
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      )}
    </div>
  );
}
