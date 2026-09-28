'use client';

import * as React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/field';
import { ErrorNote, SkeletonRows } from '@/components/ui/states';
import { StatCard, TableWrap, Td, Th } from '@/components/dashboard/primitives';
import { AppointmentsTrendChart, RevenueChart, TopServicesChart } from '@/components/dashboard/charts';
import { formatMoney, toDateKey } from '@/lib/utils';

type Summary = {
  stats: {
    todayAppointments: number;
    todayPatients: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    revenue: number;
    newPatients: number;
    openCases: number;
  };
  trend: { date: string; total: number; completed: number }[];
  revenue: { month: string; total: number }[];
  services: { name: string; count: number }[];
  balances: { id: string; code: string; fullName: string; phone: string; charged: number; paid: number; balance: number }[];
};

export function ReportsView() {
  const [from, setFrom] = React.useState(() => toDateKey(new Date(new Date().setMonth(new Date().getMonth() - 1))));
  const [to, setTo] = React.useState(() => toDateKey(new Date()));
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setSummary(null);
    setError(null);
    try {
      const response = await fetch(`/api/reports?from=${from}&to=${to}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'تعذر تحميل التقارير.');
        return;
      }
      setSummary(payload.data);
    } catch {
      setError('تعذر الاتصال بالخادم.');
    }
  }, [from, to]);

  React.useEffect(() => {
    load();
  }, [load]);

  function exportCsv(type: 'appointments' | 'payments') {
    window.open(`/api/reports?type=${type}&format=csv&from=${from}&to=${to}`, '_blank');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="report-from">من تاريخ</Label>
          <Input id="report-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="report-to">إلى تاريخ</Label>
          <Input id="report-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={() => exportCsv('appointments')}>
          <Download size={16} />
          تصدير المواعيد CSV
        </Button>
        <Button variant="secondary" onClick={() => exportCsv('payments')}>
          <Download size={16} />
          تصدير المدفوعات CSV
        </Button>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {summary === null && !error && <SkeletonRows rows={6} />}

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="مواعيد اليوم" value={summary.stats.todayAppointments} />
            <StatCard label="المكتملة (الفترة)" value={summary.stats.completed} tone="ok" />
            <StatCard label="الملغاة (الفترة)" value={summary.stats.cancelled} tone="danger" />
            <StatCard label="الإيرادات (الفترة)" value={formatMoney(summary.stats.revenue)} tone="gold" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="حركة المواعيد" />
              <CardBody>
                <AppointmentsTrendChart data={summary.trend} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="الإيرادات الشهرية" />
              <CardBody>
                <RevenueChart data={summary.revenue} />
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="الخدمات الأكثر طلباً" />
              <CardBody>
                <TopServicesChart data={summary.services} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="أرصدة مستحقة" description="أعلى المرضى ديناً." />
              <TableWrap>
                <thead>
                  <tr>
                    <Th>المريض</Th>
                    <Th>المستحق</Th>
                    <Th>المدفوع</Th>
                    <Th>الرصيد</Th>
                  </tr>
                </thead>
                <tbody>
                  {summary.balances.length === 0 && (
                    <tr>
                      <Td className="text-center text-muted" colSpan={4}>
                        لا توجد أرصدة مستحقة.
                      </Td>
                    </tr>
                  )}
                  {summary.balances.map((row) => (
                    <tr key={row.id}>
                      <Td>{row.fullName}</Td>
                      <Td className="tabular-nums text-muted">{formatMoney(row.charged)}</Td>
                      <Td className="tabular-nums text-muted">{formatMoney(row.paid)}</Td>
                      <Td className="tabular-nums font-medium text-danger">{formatMoney(row.balance)}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
