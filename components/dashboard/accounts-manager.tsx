'use client';

import * as React from 'react';
import Link from 'next/link';
import { KeyRound, UserPlus, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input, Label } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { EmptyState, ErrorNote, SkeletonRows } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { TableWrap, Td, Th } from '@/components/dashboard/primitives';
import { DeleteButton } from '@/components/dashboard/delete-button';
import { displayLocalPhone, formatShortDate } from '@/lib/utils';

type AccountRow = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  patient: { id: string; code: string; deletedAt: string | null } | null;
};

type PatientOption = { id: string; code: string; fullName: string; phone: string; userId: string | null };

/** كلمة مرور مؤقتة تُعرض مرة واحدة للدكتورة لتعطيها للمريض. */
function PasswordNotice({ phone, password, onClose }: { phone: string; password: string; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="بيانات الدخول المؤقتة">
      <p className="text-sm leading-7 text-muted">أعطِ المريض هذه البيانات. سيُطلب منه تغيير كلمة المرور عند أول دخول. لن تظهر كلمة المرور مرة أخرى.</p>
      <dl className="mt-4 space-y-3 rounded-xl border border-line bg-orchid-50/60 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">رقم الموبايل</dt>
          <dd dir="ltr" className="font-medium tabular-nums">{phone}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">كلمة المرور</dt>
          <dd dir="ltr" className="select-all font-mono text-base font-semibold">{password}</dd>
        </div>
      </dl>
    </Modal>
  );
}

export function AccountsManager() {
  const toast = useToast();
  const [rows, setRows] = React.useState<AccountRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<{ phone: string; password: string } | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [options, setOptions] = React.useState<PatientOption[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/accounts');
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'تعذر تحميل الحسابات.');
        setRows([]);
        return;
      }
      setRows(payload.data);
    } catch {
      setError('تعذر الاتصال بالخادم.');
      setRows([]);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // البحث عن مرضى بدون حساب لإنشاء حساب لهم
  React.useEffect(() => {
    if (!createOpen) return;
    const handle = setTimeout(async () => {
      const response = await fetch(`/api/patients?pageSize=20&q=${encodeURIComponent(query)}`);
      const payload = await response.json().catch(() => null);
      if (response.ok && payload) setOptions((payload.data.rows as PatientOption[]).filter((p) => !p.userId));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, createOpen]);

  async function patch(row: AccountRow, body: Record<string, unknown>) {
    setBusy(row.id);
    try {
      const response = await fetch(`/api/accounts/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.push(payload.error ?? 'تعذر تنفيذ العملية.', 'error');
        return;
      }
      if (payload.data.temporaryPassword) {
        setNotice({ phone: displayLocalPhone(row.phone), password: payload.data.temporaryPassword });
      } else {
        toast.push(body.isActive ? 'تم تفعيل الحساب.' : 'تم إيقاف الحساب.');
      }
      load();
    } finally {
      setBusy(null);
    }
  }

  async function createFor(patient: PatientOption) {
    setBusy(patient.id);
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id }),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.push(payload.error ?? 'تعذر إنشاء الحساب.', 'error');
        return;
      }
      setCreateOpen(false);
      setQuery('');
      setNotice({ phone: payload.data.phone, password: payload.data.temporaryPassword });
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus size={17} /> إنشاء حساب لمريض
        </Button>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {rows === null && <SkeletonRows rows={6} />}

      {rows !== null && rows.length === 0 && !error && (
        <EmptyState
          icon={<Users size={28} />}
          title="لا توجد حسابات بعد"
          description="ينشئ المرضى حساباتهم من الموقع برقم الموبايل، أو يمكنك إنشاء حساب لمريض مسجّل في العيادة."
        />
      )}

      {rows !== null && rows.length > 0 && (
        <Card>
          <TableWrap>
            <thead>
              <tr>
                <Th>المريض</Th>
                <Th>رقم الموبايل</Th>
                <Th>الملف</Th>
                <Th>آخر دخول</Th>
                <Th>الحالة</Th>
                <Th className="text-left">إجراءات</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <Td>
                    <span className="font-medium">{row.fullName}</span>
                    <span className="block text-xs text-muted">منذ {formatShortDate(row.createdAt)}</span>
                  </Td>
                  <Td dir="ltr" className="text-right tabular-nums text-muted">{displayLocalPhone(row.phone)}</Td>
                  <Td>
                    {row.patient && !row.patient.deletedAt ? (
                      <Link href={`/dashboard/patients/${row.patient.id}`} className="text-orchid-600 hover:underline">
                        {row.patient.code}
                      </Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                  <Td className="text-muted">{row.lastLoginAt ? formatShortDate(row.lastLoginAt) : 'لم يدخل بعد'}</Td>
                  <Td>
                    <Badge className={row.isActive ? 'border-[#CDE6D8] bg-[#E8F3EC] text-[#417A5C]' : 'border-[#F4CACC] bg-[#FDEEEE] text-[#B3363F]'}>
                      {row.isActive ? 'فعّال' : 'موقوف'}
                    </Badge>
                  </Td>
                  <Td className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => patch(row, { resetPassword: true })}
                        disabled={busy === row.id}
                        title="إعادة تعيين كلمة المرور"
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-orchid-50 hover:text-orchid-700"
                      >
                        <KeyRound size={14} /> كلمة مرور جديدة
                      </button>
                      <button
                        onClick={() => patch(row, { isActive: !row.isActive })}
                        disabled={busy === row.id}
                        className="rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-orchid-50 hover:text-orchid-700"
                      >
                        {row.isActive ? 'إيقاف' : 'تفعيل'}
                      </button>
                      <DeleteButton
                        endpoint={`/api/accounts/${row.id}`}
                        title="حذف الحساب"
                        message={`سيُحذف حساب ${row.fullName} نهائياً ولن يتمكن من الدخول. ملفه الطبي يبقى في سجلات العيادة ويمكن حذفه من صفحة المرضى.`}
                        onDeleted={load}
                      />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="إنشاء حساب لمريض">
        <p className="mb-4 text-sm leading-7 text-muted">
          اختر مريضاً مسجّلاً في العيادة. سيدخل برقم موبايله المسجّل في ملفه وبكلمة مرور مؤقتة تظهر لك الآن.
        </p>
        <Label htmlFor="acc-q">بحث بالاسم أو الرقم</Label>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input id="acc-q" className="pr-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="اسم المريض أو 09…" />
        </div>
        <ul className="mt-3 max-h-72 divide-y divide-line overflow-y-auto rounded-xl border border-line">
          {options.length === 0 && <li className="p-4 text-sm text-muted">لا يوجد مرضى بدون حساب مطابقون للبحث.</li>}
          {options.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <span>
                <span className="font-medium">{p.fullName}</span>
                <span className="block text-xs text-muted" dir="ltr">{displayLocalPhone(p.phone)} · {p.code}</span>
              </span>
              <Button size="sm" variant="secondary" loading={busy === p.id} onClick={() => createFor(p)}>
                إنشاء
              </Button>
            </li>
          ))}
        </ul>
      </Modal>

      {notice && <PasswordNotice phone={notice.phone} password={notice.password} onClose={() => setNotice(null)} />}
    </div>
  );
}
