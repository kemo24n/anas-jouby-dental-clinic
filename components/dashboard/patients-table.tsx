'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label, Select, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { EmptyState, ErrorNote, SkeletonRows } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { TableWrap, Td, Th } from '@/components/dashboard/primitives';
import { Badge } from '@/components/ui/badge';
import { appointmentStatusLabels, appointmentStatusTone, genderLabels } from '@/lib/labels';
import { displayLocalPhone, formatShortDate } from '@/lib/utils';
import { DeleteButton } from '@/components/dashboard/delete-button';

type Row = {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  email: string | null;
  registeredAt: string;
  appointments: { startsAt: string; status: keyof typeof appointmentStatusLabels }[];
};

type SortKey = 'recent' | 'name';

export function PatientsTable({ canWrite, canDelete = false }: { canWrite: boolean; canDelete?: boolean }) {
  const toast = useToast();
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortKey>('recent');
  const [data, setData] = React.useState<{ rows: Row[]; total: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const pageSize = 20;

  const load = React.useCallback(async () => {
    setData(null);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (query.trim()) params.set('q', query.trim());
      const response = await fetch(`/api/patients?${params}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'تعذر تحميل قائمة المرضى.');
        setData({ rows: [], total: 0 });
        return;
      }
      setData(payload.data);
    } catch {
      setError('تعذر الاتصال بالخادم.');
      setData({ rows: [], total: 0 });
    }
  }, [page, query]);

  React.useEffect(() => {
    const timer = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const rows = React.useMemo(() => {
    if (!data) return [];
    const copy = [...data.rows];
    if (sort === 'name') copy.sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar'));
    return copy;
  }, [data, sort]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="بحث بالاسم، الهاتف، البريد، أو رقم المريض…"
            aria-label="بحث عن مريض"
            className="h-11 w-full rounded-xl border border-line bg-white pr-10 text-sm placeholder:text-muted/70 focus:border-orchid-400 focus:outline-none focus:ring-2 focus:ring-orchid-200"
          />
        </div>
        <Select
          aria-label="الترتيب"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-11 w-40 py-0 pl-8"
        >
          <option value="recent">الأحدث تسجيلاً</option>
          <option value="name">الاسم أبجدياً</option>
        </Select>
        {canWrite && (
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus size={17} />
            إضافة مريض
          </Button>
        )}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {data === null && <SkeletonRows rows={8} />}

      {data !== null && rows.length === 0 && !error && (
        <EmptyState
          icon={<Users size={28} />}
          title={query ? 'لا توجد نتائج مطابقة' : 'لا يوجد مرضى بعد'}
          description={query ? 'جرّبي كلمة بحث أخرى.' : 'ابدئي بإضافة أول مريض إلى سجلات العيادة.'}
        />
      )}

      {rows.length > 0 && (
        <Card>
          <TableWrap>
            <thead>
              <tr>
                <Th>الاسم</Th>
                <Th>رقم المريض</Th>
                <Th>رقم الهاتف</Th>
                <Th>آخر زيارة</Th>
                <Th>الحالة</Th>
                <Th>تاريخ التسجيل</Th>
                {canDelete && <Th className="w-10"><span className="sr-only">حذف</span></Th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const last = row.appointments[0];
                return (
                  <tr key={row.id} className="hover:bg-orchid-50/40">
                    <Td>
                      <Link href={`/dashboard/patients/${row.id}`} className="font-medium hover:text-orchid-600">
                        {row.fullName}
                      </Link>
                      {row.email && <span className="block text-xs text-muted">{row.email}</span>}
                    </Td>
                    <Td className="tabular-nums text-muted">{row.code}</Td>
                    <Td dir="ltr" className="text-right tabular-nums text-muted">
                      {displayLocalPhone(row.phone)}
                    </Td>
                    <Td className="text-muted">{last ? formatShortDate(last.startsAt) : '—'}</Td>
                    <Td>
                      {last ? (
                        <Badge className={appointmentStatusTone[last.status]}>{appointmentStatusLabels[last.status]}</Badge>
                      ) : (
                        <span className="text-xs text-muted">لا مواعيد</span>
                      )}
                    </Td>
                    <Td className="text-muted">{formatShortDate(row.registeredAt)}</Td>
                    {canDelete && (
                      <Td>
                        <DeleteButton
                          endpoint={`/api/patients/${row.id}`}
                          title="حذف المريض نهائياً"
                          message={`سيُحذف ملف ${row.fullName} بالكامل: التاريخ الطبي، المواعيد، المدفوعات، خطط العلاج، الملفات والأشعة، وحساب البوابة إن وجد. لا يمكن التراجع.`}
                          onDeleted={load}
                        />
                      </Td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>

          <div className="flex items-center justify-between px-5 py-3.5 text-sm text-muted">
            <span>
              {data?.total ?? 0} مريض · صفحة {page} من {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                السابق
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                التالي
              </Button>
            </div>
          </div>
        </Card>
      )}

      {canWrite && (
        <NewPatientModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false);
            toast.push('تمت إضافة المريض بنجاح.');
            await load();
          }}
        />
      )}
    </div>
  );
}

export function NewPatientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (patientId: string) => void;
}) {
  const empty = { fullName: '', phone: '', email: '', birthDate: '', gender: 'FEMALE', address: '', notes: '' };
  const [form, setForm] = React.useState(empty);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setForm(empty);
      setError(null);
      setFieldErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function submit() {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'تعذر إضافة المريض.');
        setFieldErrors(payload.fieldErrors ?? {});
        return;
      }
      onCreated(payload.data.id);
    } catch {
      setError('تعذر الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="إضافة مريض"
      footer={
        <>
          <button onClick={onClose} className="h-10 rounded-xl px-4 text-sm text-muted hover:bg-orchid-50">
            تراجع
          </button>
          <Button size="sm" loading={loading} onClick={submit}>
            حفظ
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <ErrorNote>{error}</ErrorNote>}

        <div>
          <Label htmlFor="np-name" required>
            الاسم الكامل
          </Label>
          <Input id="np-name" value={form.fullName} onChange={set('fullName')} error={fieldErrors.fullName} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="np-phone" required>
              رقم الهاتف
            </Label>
            <Input id="np-phone" dir="ltr" value={form.phone} onChange={set('phone')} error={fieldErrors.phone} />
          </div>
          <div>
            <Label htmlFor="np-email">البريد الإلكتروني</Label>
            <Input id="np-email" type="email" dir="ltr" value={form.email} onChange={set('email')} error={fieldErrors.email} />
          </div>
          <div>
            <Label htmlFor="np-birth">تاريخ الميلاد</Label>
            <Input id="np-birth" type="date" value={form.birthDate} onChange={set('birthDate')} />
          </div>
          <div>
            <Label htmlFor="np-gender">الجنس</Label>
            <Select id="np-gender" value={form.gender} onChange={set('gender')}>
              {Object.entries(genderLabels).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="np-address">العنوان</Label>
          <Input id="np-address" value={form.address} onChange={set('address')} />
        </div>

        <div>
          <Label htmlFor="np-notes">ملاحظات إدارية</Label>
          <Textarea id="np-notes" rows={2} value={form.notes} onChange={set('notes')} />
        </div>
      </div>
    </Modal>
  );
}
