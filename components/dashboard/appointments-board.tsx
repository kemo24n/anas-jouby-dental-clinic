'use client';
import { DeleteButton } from '@/components/dashboard/delete-button';

import * as React from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight, MessageCircle, Plus } from 'lucide-react';
import type { AppointmentStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { EmptyState, ErrorNote, SkeletonRows } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { TableWrap, Td, Th } from '@/components/dashboard/primitives';
import { appointmentStatusLabels, appointmentStatusTone, weekdayLabels } from '@/lib/labels';
import { cn, formatArabicDate, formatArabicTime, formatShortDate, toDateKey } from '@/lib/utils';
import { WA_MESSAGES, whatsappLink } from '@/lib/whatsapp';

export type ServiceOption = { id: string; name: string; durationMin: number };

type Appointment = {
  id: string;
  code: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  patient: { id: string; code: string; fullName: string; phone: string };
  service: { id: string; name: string; durationMin: number } | null;
  dentist: { id: string; fullName: string } | null;
};

type View = 'day' | 'week' | 'month' | 'list';

const VIEWS: { key: View; label: string }[] = [
  { key: 'day', label: 'اليوم' },
  { key: 'week', label: 'الأسبوع' },
  { key: 'month', label: 'الشهر' },
  { key: 'list', label: 'قائمة' },
];

const STATUS_ACTIONS: { status: AppointmentStatus; label: string }[] = [
  { status: 'CONFIRMED', label: 'تأكيد' },
  { status: 'ARRIVED', label: 'تسجيل الحضور' },
  { status: 'COMPLETED', label: 'إكمال' },
  { status: 'NO_SHOW', label: 'لم يحضر' },
];

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // الأسبوع يبدأ من الأحد
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function AppointmentsBoard({
  services,
  canWrite,
}: {
  services: ServiceOption[];
  canWrite: boolean;
}) {
  const toast = useToast();
  const [view, setView] = React.useState<View>('day');
  const [anchor, setAnchor] = React.useState(() => new Date());
  const [statusFilter, setStatusFilter] = React.useState<'' | AppointmentStatus>('');
  const [rows, setRows] = React.useState<Appointment[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<Appointment | null>(null);
  const [busy, setBusy] = React.useState(false);

  const range = React.useMemo(() => {
    if (view === 'day') return { from: anchor, to: anchor };
    if (view === 'week') {
      const from = startOfWeek(anchor);
      return { from, to: addDays(from, 6) };
    }
    if (view === 'month') {
      return {
        from: new Date(anchor.getFullYear(), anchor.getMonth(), 1),
        to: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0),
      };
    }
    return { from: addDays(new Date(), -30), to: addDays(new Date(), 60) };
  }, [view, anchor]);

  const load = React.useCallback(async () => {
    setError(null);
    setRows(null);
    const params = new URLSearchParams({ from: toDateKey(range.from), to: toDateKey(range.to) });
    if (statusFilter) params.set('status', statusFilter);
    try {
      const response = await fetch(`/api/appointments?${params}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'تعذر تحميل المواعيد.');
        setRows([]);
        return;
      }
      setRows(payload.data);
    } catch {
      setError('تعذر الاتصال بالخادم.');
      setRows([]);
    }
  }, [range.from, range.to, statusFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  function shift(direction: -1 | 1) {
    if (view === 'day') setAnchor((d) => addDays(d, direction));
    else if (view === 'week') setAnchor((d) => addDays(d, direction * 7));
    else if (view === 'month') setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + direction, 1));
  }

  async function updateAppointment(id: string, body: Record<string, unknown>, successMessage: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.push(payload.error ?? 'تعذر تنفيذ العملية.', 'error');
        return false;
      }
      toast.push(successMessage);
      setDetail(null);
      setCancelTarget(null);
      await load();
      return true;
    } catch {
      toast.push('تعذر الاتصال بالخادم.', 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }

  const label =
    view === 'day'
      ? formatArabicDate(anchor)
      : view === 'week'
        ? `${formatShortDate(range.from)} — ${formatShortDate(range.to)}`
        : view === 'month'
          ? `${anchor.getMonth() + 1}/${anchor.getFullYear()}`
          : 'كل المواعيد القريبة';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-line bg-white p-1">
          {VIEWS.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm transition-colors',
                view === item.key ? 'bg-orchid-500 text-white' : 'text-muted hover:text-ink',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="تصفية حسب الحالة"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | '')}
            className="h-10 w-44 py-0 pl-8"
          >
            <option value="">كل الحالات</option>
            {Object.entries(appointmentStatusLabels).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </Select>
          {canWrite && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={17} />
              موعد جديد
            </Button>
          )}
        </div>
      </div>

      {view !== 'list' && (
        <div className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2">
          <button onClick={() => shift(1)} aria-label="التالي" className="rounded-lg p-2 text-muted hover:bg-orchid-50">
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium">{label}</p>
            <button onClick={() => setAnchor(new Date())} className="text-xs text-orchid-600 hover:underline">
              اليوم
            </button>
          </div>
          <button onClick={() => shift(-1)} aria-label="السابق" className="rounded-lg p-2 text-muted hover:bg-orchid-50">
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {error && <ErrorNote>{error}</ErrorNote>}
      {rows === null && <SkeletonRows rows={6} />}

      {rows !== null && rows.length === 0 && !error && (
        <EmptyState
          icon={<CalendarDays size={28} />}
          title="لا توجد مواعيد في هذه الفترة"
          description="غيّري الفترة أو أضيفي موعداً جديداً."
        />
      )}

      {rows !== null && rows.length > 0 && view === 'month' && (
        <MonthGrid anchor={anchor} rows={rows} onSelect={setDetail} />
      )}

      {rows !== null && rows.length > 0 && (view === 'day' || view === 'week') && (
        <DayColumns from={range.from} days={view === 'day' ? 1 : 7} rows={rows} onSelect={setDetail} />
      )}

      {rows !== null && rows.length > 0 && view === 'list' && (
        <Card>
          <TableWrap>
            <thead>
              <tr>
                <Th>الموعد</Th>
                <Th>المريض</Th>
                <Th>الخدمة</Th>
                <Th>الطبيبة</Th>
                <Th>الحالة</Th>
                <Th>إجراءات</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-orchid-50/40">
                  <Td>
                    <span className="block font-medium">{formatShortDate(row.startsAt)}</span>
                    <span className="text-xs tabular-nums text-muted">{formatArabicTime(row.startsAt)}</span>
                  </Td>
                  <Td>
                    <Link href={`/dashboard/patients/${row.patient.id}`} className="font-medium hover:text-orchid-600">
                      {row.patient.fullName}
                    </Link>
                    <span dir="ltr" className="block text-xs text-muted">
                      {row.patient.phone}
                    </span>
                  </Td>
                  <Td className="text-muted">{row.service?.name ?? '—'}</Td>
                  <Td className="text-muted">{row.dentist?.fullName ?? '—'}</Td>
                  <Td>
                    <Badge className={appointmentStatusTone[row.status]}>{appointmentStatusLabels[row.status]}</Badge>
                  </Td>
                  <Td>
                    <button onClick={() => setDetail(row)} className="text-sm text-orchid-600 hover:underline">
                      التفاصيل
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      )}

      {canWrite && (
        <CreateAppointmentModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          services={services}
          onCreated={async () => {
            setCreateOpen(false);
            toast.push('تم إنشاء الموعد بنجاح.');
            await load();
          }}
        />
      )}

      <AppointmentDetail
        appointment={detail}
        canWrite={canWrite}
        busy={busy}
        onClose={() => setDetail(null)}
        onStatus={(status) =>
          detail && updateAppointment(detail.id, { status }, `تم تحديث حالة الموعد إلى «${appointmentStatusLabels[status]}».`)
        }
        onReschedule={(date, time) =>
          detail && updateAppointment(detail.id, { date, time, status: 'RESCHEDULED' }, 'تمت إعادة جدولة الموعد.')
        }
        onNotes={(notes) => detail && updateAppointment(detail.id, { notes }, 'تم حفظ الملاحظة.')}
        onRequestCancel={() => {
          setCancelTarget(detail);
          setDetail(null);
        }}
        onDeleted={async () => {
          setDetail(null);
          await load();
        }}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        loading={busy}
        title="إلغاء الموعد"
        message={`سيتم إلغاء الموعد ${cancelTarget?.code ?? ''} وإشعار المريض إن كان لديه حساب. هل تريدين المتابعة؟`}
        confirmLabel="إلغاء الموعد"
        onClose={() => setCancelTarget(null)}
        onConfirm={() =>
          cancelTarget && updateAppointment(cancelTarget.id, { status: 'CANCELLED' }, 'تم إلغاء الموعد.')
        }
      />
    </div>
  );
}

/** عرض اليوم/الأسبوع كأعمدة زمنية. */
function DayColumns({
  from,
  days,
  rows,
  onSelect,
}: {
  from: Date;
  days: number;
  rows: Appointment[];
  onSelect: (appointment: Appointment) => void;
}) {
  const columns = Array.from({ length: days }, (_, index) => addDays(from, index));

  return (
    <div className={cn('grid gap-4', days === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-7')}>
      {columns.map((day) => {
        const key = toDateKey(day);
        const items = rows.filter((row) => toDateKey(new Date(row.startsAt)) === key);
        const isToday = key === toDateKey(new Date());

        return (
          <div key={key} className={cn('card p-3', isToday && 'ring-1 ring-orchid-200')}>
            <div className="mb-3 flex items-baseline justify-between px-1">
              <p className="text-sm font-medium">{weekdayLabels[day.getDay()]}</p>
              <p className="text-xs tabular-nums text-muted">{formatShortDate(day)}</p>
            </div>
            {items.length === 0 ? (
              <p className="px-1 py-6 text-center text-xs text-muted">لا مواعيد</p>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => onSelect(item)}
                      className={cn(
                        'w-full rounded-xl border px-3 py-2.5 text-right transition-shadow hover:shadow-soft',
                        appointmentStatusTone[item.status],
                      )}
                    >
                      <span className="block text-xs tabular-nums opacity-80">{formatArabicTime(item.startsAt)}</span>
                      <span className="mt-0.5 block text-sm font-medium">{item.patient.fullName}</span>
                      <span className="block text-xs opacity-80">{item.service?.name ?? 'بدون خدمة محددة'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** عرض الشهر كشبكة تقويم. */
function MonthGrid({
  anchor,
  rows,
  onSelect,
}: {
  anchor: Date;
  rows: Appointment[];
  onSelect: (appointment: Appointment) => void;
}) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  const leading = first.getDay();
  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(anchor.getFullYear(), anchor.getMonth(), index + 1)),
  ];

  return (
    <Card className="p-3">
      <div className="grid grid-cols-7 gap-px text-center">
        {weekdayLabels.map((day) => (
          <div key={day} className="py-2 text-xs font-medium text-muted">
            {day}
          </div>
        ))}
        {cells.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;
          const key = toDateKey(day);
          const items = rows.filter((row) => toDateKey(new Date(row.startsAt)) === key);
          const isToday = key === toDateKey(new Date());

          return (
            <div
              key={key}
              className={cn(
                'min-h-24 rounded-xl border border-line p-1.5 text-right',
                isToday && 'border-orchid-300 bg-orchid-50/40',
              )}
            >
              <p className="mb-1 text-xs tabular-nums text-muted">{day.getDate()}</p>
              <div className="space-y-1">
                {items.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className={cn('block w-full truncate rounded-md border px-1.5 py-1 text-[11px]', appointmentStatusTone[item.status])}
                  >
                    {formatArabicTime(item.startsAt).slice(0, 5)} {item.patient.fullName}
                  </button>
                ))}
                {items.length > 3 && <p className="text-[11px] text-muted">+{items.length - 3} أخرى</p>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** نافذة تفاصيل الموعد مع كل الإجراءات. */
function AppointmentDetail({
  appointment,
  canWrite,
  busy,
  onClose,
  onStatus,
  onReschedule,
  onNotes,
  onRequestCancel,
  onDeleted,
}: {
  appointment: Appointment | null;
  canWrite: boolean;
  busy: boolean;
  onClose: () => void;
  onStatus: (status: AppointmentStatus) => void;
  onReschedule: (date: string, time: string) => void;
  onNotes: (notes: string) => void;
  onRequestCancel: () => void;
  onDeleted: () => void;
}) {
  const [notes, setNotes] = React.useState('');
  const [date, setDate] = React.useState('');
  const [slots, setSlots] = React.useState<string[]>([]);
  const [time, setTime] = React.useState('');
  const [loadingSlots, setLoadingSlots] = React.useState(false);

  React.useEffect(() => {
    setNotes(appointment?.notes ?? '');
    setDate('');
    setTime('');
    setSlots([]);
  }, [appointment]);

  React.useEffect(() => {
    if (!date || !appointment) return;
    setLoadingSlots(true);
    const params = new URLSearchParams({ date, ignoreAppointmentId: appointment.id });
    if (appointment.service) params.set('serviceId', appointment.service.id);
    fetch(`/api/availability?${params}`)
      .then((response) => response.json())
      .then((payload) => setSlots(payload.ok ? payload.data.slots ?? payload.data : []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, appointment]);

  if (!appointment) return null;

  return (
    <Modal open onClose={onClose} title={`الموعد ${appointment.code}`}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Detail label="المريض" value={appointment.patient.fullName} />
          <Detail label="رقم الهاتف" value={appointment.patient.phone} ltr />
          <Detail label="التاريخ" value={formatArabicDate(appointment.startsAt)} />
          <Detail label="الوقت" value={formatArabicTime(appointment.startsAt)} />
          <Detail label="الخدمة" value={appointment.service?.name ?? '—'} />
          <Detail label="الطبيبة" value={appointment.dentist?.fullName ?? '—'} />
        </div>

        {appointment.reason && (
          <p className="rounded-xl bg-orchid-50/60 px-4 py-3 text-sm leading-7">
            <span className="font-medium">سبب الزيارة: </span>
            {appointment.reason}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={appointmentStatusTone[appointment.status]}>{appointmentStatusLabels[appointment.status]}</Badge>
          <a
            href={whatsappLink(WA_MESSAGES.contactPatient(), appointment.patient.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-ok hover:underline"
          >
            <MessageCircle size={16} />
            مراسلة المريض عبر واتساب
          </a>
        </div>

        {canWrite && (
          <>
            <div>
              <Label>تغيير الحالة</Label>
              <div className="flex flex-wrap gap-2">
                {STATUS_ACTIONS.map((action) => (
                  <Button
                    key={action.status}
                    variant="secondary"
                    size="sm"
                    disabled={busy || appointment.status === action.status}
                    onClick={() => onStatus(action.status)}
                  >
                    {action.label}
                  </Button>
                ))}
                <Button variant="danger" size="sm" disabled={busy} onClick={onRequestCancel}>
                  إلغاء الموعد
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-line p-4">
              <Label>إعادة الجدولة</Label>
              <Input type="date" value={date} min={toDateKey(new Date())} onChange={(e) => setDate(e.target.value)} />
              {date && (
                <div className="mt-3">
                  {loadingSlots && <p className="text-sm text-muted">جارٍ تحميل الأوقات المتاحة…</p>}
                  {!loadingSlots && slots.length === 0 && (
                    <p className="text-sm text-muted">لا توجد أوقات متاحة في هذا اليوم.</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setTime(slot)}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-sm tabular-nums',
                          time === slot ? 'border-orchid-500 bg-orchid-500 text-white' : 'border-line hover:border-orchid-300',
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Button
                className="mt-3"
                size="sm"
                disabled={!date || !time || busy}
                onClick={() => onReschedule(date, time)}
              >
                حفظ الموعد الجديد
              </Button>
            </div>

            <div>
              <Label htmlFor="appointment-notes">ملاحظات إدارية</Label>
              <Textarea
                id="appointment-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظة داخلية حول الموعد (غير سريرية)."
              />
              <Button className="mt-2" size="sm" variant="secondary" disabled={busy} onClick={() => onNotes(notes)}>
                حفظ الملاحظة
              </Button>
            </div>
          </>
        )}

        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/patients/${appointment.patient.id}`}
            className="inline-block text-sm text-orchid-600 hover:underline"
          >
            فتح ملف المريض
          </Link>
          {canWrite && (
            <DeleteButton
              endpoint={`/api/appointments/${appointment.id}`}
              title="حذف الموعد"
              message={`سيتم حذف الموعد ${appointment.code} نهائياً من السجل. (لإلغاء الموعد مع إبقائه في السجل استخدمي «إلغاء الموعد».)`}
              onDeleted={onDeleted}
              label="حذف الموعد"
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

function Detail({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p dir={ltr ? 'ltr' : undefined} className={cn('mt-0.5 font-medium', ltr && 'text-right')}>
        {value}
      </p>
    </div>
  );
}

/** نافذة إنشاء موعد: بحث عن مريض، اختيار خدمة، ثم وقت متاح فعلياً. */
function CreateAppointmentModal({
  open,
  onClose,
  services,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  services: ServiceOption[];
  onCreated: () => void;
}) {
  const [query, setQuery] = React.useState('');
  const [patients, setPatients] = React.useState<{ id: string; fullName: string; phone: string; code: string }[]>([]);
  const [patient, setPatient] = React.useState<{ id: string; fullName: string } | null>(null);
  const [serviceId, setServiceId] = React.useState('');
  const [date, setDate] = React.useState('');
  const [slots, setSlots] = React.useState<string[]>([]);
  const [time, setTime] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setPatient(null);
      setServiceId('');
      setDate('');
      setTime('');
      setSlots([]);
      setReason('');
      setError(null);
    }
  }, [open]);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setPatients([]);
      return;
    }
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/patients?q=${encodeURIComponent(query.trim())}&pageSize=6`);
      const payload = await response.json();
      if (response.ok) setPatients(payload.data.rows);
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  React.useEffect(() => {
    if (!date) return;
    const params = new URLSearchParams({ date });
    if (serviceId) params.set('serviceId', serviceId);
    fetch(`/api/availability?${params}`)
      .then((response) => response.json())
      .then((payload) => setSlots(payload.ok ? payload.data.slots ?? payload.data : []))
      .catch(() => setSlots([]));
  }, [date, serviceId]);

  async function submit() {
    if (!patient || !date || !time) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          serviceId: serviceId || undefined,
          date,
          time,
          reason: reason || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'تعذر إنشاء الموعد.');
        return;
      }
      onCreated();
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
      title="موعد جديد"
      footer={
        <>
          <button onClick={onClose} className="h-10 rounded-xl px-4 text-sm text-muted hover:bg-orchid-50">
            تراجع
          </button>
          <Button size="sm" loading={loading} disabled={!patient || !date || !time} onClick={submit}>
            حفظ الموعد
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <ErrorNote>{error}</ErrorNote>}

        <div>
          <Label required>المريض</Label>
          {patient ? (
            <div className="flex items-center justify-between rounded-xl border border-orchid-200 bg-orchid-50/60 px-4 py-2.5 text-sm">
              <span className="font-medium">{patient.fullName}</span>
              <button onClick={() => setPatient(null)} className="text-xs text-orchid-600 hover:underline">
                تغيير
              </button>
            </div>
          ) : (
            <>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحثي بالاسم أو رقم الهاتف أو رقم المريض…"
              />
              {patients.length > 0 && (
                <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line">
                  {patients.map((row) => (
                    <li key={row.id}>
                      <button
                        onClick={() => setPatient({ id: row.id, fullName: row.fullName })}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-orchid-50"
                      >
                        <span>{row.fullName}</span>
                        <span dir="ltr" className="text-xs text-muted">
                          {row.phone}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-muted">
                المريض غير مسجّل؟{' '}
                <Link href="/dashboard/patients" className="text-orchid-600 hover:underline">
                  أضيفيه من صفحة المرضى
                </Link>
              </p>
            </>
          )}
        </div>

        <div>
          <Label htmlFor="create-service">الخدمة</Label>
          <Select id="create-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            <option value="">بدون خدمة محددة</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.durationMin} د)
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="create-date" required>
            التاريخ
          </Label>
          <Input
            id="create-date"
            type="date"
            min={toDateKey(new Date())}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTime('');
            }}
          />
        </div>

        {date && (
          <div>
            <Label required>الوقت المتاح</Label>
            {slots.length === 0 ? (
              <p className="text-sm text-muted">لا توجد أوقات متاحة في هذا اليوم.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setTime(slot)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm tabular-nums',
                      time === slot ? 'border-orchid-500 bg-orchid-500 text-white' : 'border-line hover:border-orchid-300',
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="create-reason">سبب الزيارة</Label>
          <Textarea id="create-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
