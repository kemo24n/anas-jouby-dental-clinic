'use client';
import { DeleteButton } from '@/components/dashboard/delete-button';

import * as React from 'react';
import Link from 'next/link';
import { Stethoscope } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/field';
import { EmptyState, ErrorNote, SkeletonRows } from '@/components/ui/states';
import { caseStatusLabels } from '@/lib/labels';
import { formatShortDate } from '@/lib/utils';
import type { CaseStatus } from '@prisma/client';

type CaseRow = {
  id: string;
  title: string;
  diagnosis: string | null;
  teeth: number[];
  status: CaseStatus;
  startDate: string;
  patient: { id: string; code: string; fullName: string };
};

export function CasesList() {
  const [statusFilter, setStatusFilter] = React.useState<'' | CaseStatus>('');
  const [rows, setRows] = React.useState<CaseRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRows(null);
    setError(null);
    fetch('/api/cases')
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok) {
          setError(payload.error ?? 'تعذر تحميل الحالات.');
          setRows([]);
          return;
        }
        setRows(payload.data);
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
          onChange={(e) => setStatusFilter(e.target.value as CaseStatus | '')}
          className="h-10 w-48 py-0 pl-8"
        >
          <option value="">كل الحالات</option>
          {Object.entries(caseStatusLabels).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </Select>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {rows === null && <SkeletonRows rows={6} />}

      {rows !== null && filtered.length === 0 && !error && (
        <EmptyState
          icon={<Stethoscope size={28} />}
          title="لا توجد حالات"
          description="تُنشأ الحالات من داخل ملف كل مريض."
        />
      )}

      {filtered.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardHeader
                title={item.title}
                description={`المريض: ${item.patient.fullName} · ${formatShortDate(item.startDate)}`}
                action={
                  <div className="flex items-center gap-1">
                    <Badge className="border-orchid-200 bg-orchid-50 text-orchid-700">{caseStatusLabels[item.status]}</Badge>
                    <DeleteButton
                      endpoint={`/api/cases/${item.id}`}
                      title="حذف الحالة"
                      message={`سيتم حذف الحالة «${item.title}» من ملف ${item.patient.fullName}.`}
                      onDeleted={() => setRows((prev) => (prev ?? []).filter((r) => r.id !== item.id))}
                    />
                  </div>
                }
              />
              <CardBody className="space-y-2 text-sm">
                {item.diagnosis && (
                  <p>
                    <span className="text-muted">التشخيص: </span>
                    {item.diagnosis}
                  </p>
                )}
                {item.teeth.length > 0 && (
                  <p>
                    <span className="text-muted">الأسنان: </span>
                    {item.teeth.join('، ')}
                  </p>
                )}
                <Link href={`/dashboard/patients/${item.patient.id}`} className="inline-block text-sm text-orchid-600 hover:underline">
                  فتح ملف المريض
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
