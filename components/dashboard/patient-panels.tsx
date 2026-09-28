'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';
import { DeleteButton } from '@/components/dashboard/delete-button';
import { Download, FileText, Plus, Trash2, Upload } from 'lucide-react';
import type { FileKind } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox, Input, Label, Select, Textarea } from '@/components/ui/field';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { EmptyState, SuccessNote } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { TableWrap, Td, Th } from '@/components/dashboard/primitives';
import {
  appointmentStatusLabels,
  appointmentStatusTone,
  caseStatusLabels,
  fileKindLabels,
  genderLabels,
  itemStatusLabels,
  paymentMethodLabels,
  planStatusLabels,
} from '@/lib/labels';
import { calcAge, cn, formatArabicDate, formatArabicTime, formatMoney, formatShortDate, displayLocalPhone } from '@/lib/utils';
import { toothName } from '@/lib/teeth';
import type { PatientProfileData } from '@/types/patient';

type Patient = PatientProfileData;

/** أداة مساعدة: استدعاء API مع رسائل عربية موحّدة. */
function useApi() {
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const call = React.useCallback(
    async (url: string, init: RequestInit, successMessage: string) => {
      setBusy(true);
      try {
        const response = await fetch(url, init);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast.push(payload.error ?? 'تعذر تنفيذ العملية.', 'error');
          return false;
        }
        toast.push(successMessage);
        router.refresh();
        return true;
      } catch {
        toast.push('تعذر الاتصال بالخادم.', 'error');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [router, toast],
  );

  return { call, busy };
}

function json(body: unknown, method: 'POST' | 'PUT' | 'PATCH' = 'POST'): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-line py-3 last:border-0">
      <p className="text-xs text-muted">{label}</p>
      <div className="mt-1 text-sm">{value || <span className="text-muted">—</span>}</div>
    </div>
  );
}

// ───────────────────────── المعلومات الشخصية ─────────────────────────

export function PersonalInfoPanel({ patient, canEdit }: { patient: Patient; canEdit: boolean }) {
  const { call, busy } = useApi();
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({
    fullName: patient.fullName,
    phone: patient.phone,
    email: patient.email ?? '',
    birthDate: patient.birthDate?.slice(0, 10) ?? '',
    gender: patient.gender,
    address: patient.address ?? '',
    notes: patient.notes ?? '',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  if (!editing) {
    return (
      <Card>
        <CardHeader
          title="المعلومات الشخصية"
          action={
            canEdit ? (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                تعديل
              </Button>
            ) : undefined
          }
        />
        <CardBody className="py-1">
          <div className="grid gap-x-8 sm:grid-cols-2">
            <Row label="الاسم الكامل" value={patient.fullName} />
            <Row label="رقم المريض" value={patient.code} />
            <Row label="رقم الهاتف" value={<span dir="ltr">{displayLocalPhone(patient.phone)}</span>} />
            <Row label="البريد الإلكتروني" value={patient.email} />
            <Row
              label="تاريخ الميلاد"
              value={patient.birthDate ? `${formatShortDate(patient.birthDate)} (${calcAge(patient.birthDate)} سنة)` : null}
            />
            <Row label="الجنس" value={genderLabels[patient.gender]} />
            <Row label="العنوان" value={patient.address} />
            <Row label="تاريخ التسجيل" value={formatArabicDate(patient.registeredAt)} />
          </div>
          {patient.notes && <Row label="ملاحظات إدارية" value={patient.notes} />}
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="تعديل المعلومات الشخصية" />
      <CardBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pi-name" required>
              الاسم الكامل
            </Label>
            <Input id="pi-name" value={form.fullName} onChange={set('fullName')} />
          </div>
          <div>
            <Label htmlFor="pi-phone" required>
              رقم الهاتف
            </Label>
            <Input id="pi-phone" dir="ltr" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <Label htmlFor="pi-email">البريد الإلكتروني</Label>
            <Input id="pi-email" type="email" dir="ltr" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <Label htmlFor="pi-birth">تاريخ الميلاد</Label>
            <Input id="pi-birth" type="date" value={form.birthDate} onChange={set('birthDate')} />
          </div>
          <div>
            <Label htmlFor="pi-gender">الجنس</Label>
            <Select id="pi-gender" value={form.gender} onChange={set('gender')}>
              {Object.entries(genderLabels).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="pi-address">العنوان</Label>
            <Input id="pi-address" value={form.address} onChange={set('address')} />
          </div>
        </div>
        <div>
          <Label htmlFor="pi-notes">ملاحظات إدارية</Label>
          <Textarea id="pi-notes" rows={3} value={form.notes} onChange={set('notes')} />
        </div>
        <div className="flex gap-2">
          <Button
            loading={busy}
            onClick={async () => {
              const done = await call(
                `/api/patients/${patient.id}`,
                { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) },
                'تم حفظ بيانات المريض.',
              );
              if (done) setEditing(false);
            }}
          >
            حفظ التعديلات
          </Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>
            تراجع
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ───────────────────────── التاريخ الطبي ─────────────────────────

const MEDICAL_FLAGS = [
  ['isPregnant', 'حمل'],
  ['isSmoker', 'تدخين'],
  ['hasHypertension', 'ارتفاع ضغط الدم'],
  ['hasDiabetes', 'السكري'],
  ['hasHeartCondition', 'أمراض قلبية'],
  ['hasBleedingDisorder', 'اضطرابات نزفية'],
] as const;

const MEDICAL_TEXT = [
  ['allergies', 'الحساسية'],
  ['chronicDiseases', 'الأمراض المزمنة'],
  ['medications', 'الأدوية الحالية'],
  ['surgeries', 'العمليات السابقة'],
] as const;

export function MedicalHistoryPanel({ patient, canEdit }: { patient: Patient; canEdit: boolean }) {
  const { call, busy } = useApi();
  const history = patient.medicalHistory;
  const [form, setForm] = React.useState({
    allergies: history?.allergies ?? '',
    chronicDiseases: history?.chronicDiseases ?? '',
    medications: history?.medications ?? '',
    surgeries: history?.surgeries ?? '',
    isPregnant: history?.isPregnant ?? false,
    isSmoker: history?.isSmoker ?? false,
    hasHypertension: history?.hasHypertension ?? false,
    hasDiabetes: history?.hasDiabetes ?? false,
    hasHeartCondition: history?.hasHeartCondition ?? false,
    hasBleedingDisorder: history?.hasBleedingDisorder ?? false,
    notes: history?.notes ?? '',
  });

  if (!history) {
    return <EmptyState title="لا تملك صلاحية الاطّلاع على التاريخ الطبي" description="هذه المعلومات متاحة للطبيبة والمدير فقط." />;
  }

  return (
    <Card>
      <CardHeader title="التاريخ الطبي" description="معلومات حساسة — تُعرض للطبيبة والمدير فقط." />
      <CardBody className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {MEDICAL_TEXT.map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={`mh-${key}`}>{label}</Label>
              <Textarea
                id={`mh-${key}`}
                rows={2}
                disabled={!canEdit}
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-orchid-50/50 p-4 sm:grid-cols-3">
          {MEDICAL_FLAGS.map(([key, label]) => (
            <Checkbox
              key={key}
              label={label}
              disabled={!canEdit}
              checked={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }))}
            />
          ))}
        </div>

        <div>
          <Label htmlFor="mh-notes">ملاحظات طبية</Label>
          <Textarea
            id="mh-notes"
            rows={3}
            disabled={!canEdit}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        {canEdit && (
          <Button
            loading={busy}
            onClick={() =>
              call(`/api/patients/${patient.id}/medical-history`, json(form, 'PUT'), 'تم حفظ التاريخ الطبي.')
            }
          >
            حفظ التاريخ الطبي
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

// ───────────────────────── التاريخ السني ─────────────────────────

const DENTAL_TEXT = [
  ['previousTreatments', 'العلاجات السابقة'],
  ['previousSurgeries', 'العمليات السنية السابقة'],
  ['previousRootCanals', 'علاجات العصب السابقة'],
  ['previousExtractions', 'القلع السابق'],
  ['previousImplants', 'الزراعات السابقة'],
  ['orthodonticHistory', 'تاريخ التقويم'],
] as const;

const DENTAL_FLAGS = [
  ['gumDisease', 'أمراض اللثة'],
  ['sensitivity', 'حساسية الأسنان'],
  ['bruxism', 'صرير الأسنان'],
] as const;

export function DentalHistoryPanel({ patient, canEdit }: { patient: Patient; canEdit: boolean }) {
  const { call, busy } = useApi();
  const history = patient.dentalHistory;
  const [form, setForm] = React.useState({
    previousTreatments: history?.previousTreatments ?? '',
    previousSurgeries: history?.previousSurgeries ?? '',
    previousRootCanals: history?.previousRootCanals ?? '',
    previousExtractions: history?.previousExtractions ?? '',
    previousImplants: history?.previousImplants ?? '',
    orthodonticHistory: history?.orthodonticHistory ?? '',
    gumDisease: history?.gumDisease ?? false,
    sensitivity: history?.sensitivity ?? false,
    bruxism: history?.bruxism ?? false,
    notes: history?.notes ?? '',
  });

  if (!history) {
    return <EmptyState title="لا تملك صلاحية الاطّلاع على التاريخ السني" />;
  }

  return (
    <Card>
      <CardHeader title="التاريخ السني" />
      <CardBody className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {DENTAL_TEXT.map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={`dh-${key}`}>{label}</Label>
              <Textarea
                id={`dh-${key}`}
                rows={2}
                disabled={!canEdit}
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-rose-50/60 p-4 sm:grid-cols-3">
          {DENTAL_FLAGS.map(([key, label]) => (
            <Checkbox
              key={key}
              label={label}
              disabled={!canEdit}
              checked={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }))}
            />
          ))}
        </div>

        <div>
          <Label htmlFor="dh-notes">ملاحظات سنية</Label>
          <Textarea
            id="dh-notes"
            rows={3}
            disabled={!canEdit}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        {canEdit && (
          <Button loading={busy} onClick={() => call(`/api/patients/${patient.id}/dental-history`, json(form, 'PUT'), 'تم حفظ التاريخ السني.')}>
            حفظ التاريخ السني
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

// ───────────────────────── المواعيد ─────────────────────────

export function AppointmentsPanel({ patient }: { patient: Patient }) {
  if (patient.appointments.length === 0) {
    return (
      <EmptyState
        title="لا توجد مواعيد"
        description="لم يُسجَّل أي موعد لهذا المريض بعد."
        actionLabel="إضافة موعد"
        actionHref="/dashboard/appointments"
      />
    );
  }

  return (
    <Card>
      <CardHeader title="سجل المواعيد" description={`${patient.appointments.length} موعد.`} />
      <TableWrap>
        <thead>
          <tr>
            <Th>التاريخ</Th>
            <Th>الوقت</Th>
            <Th>الخدمة</Th>
            <Th>سبب الزيارة</Th>
            <Th>الحالة</Th>
          </tr>
        </thead>
        <tbody>
          {patient.appointments.map((appointment) => (
            <tr key={appointment.id}>
              <Td>{formatShortDate(appointment.startsAt)}</Td>
              <Td className="tabular-nums text-muted">{formatArabicTime(appointment.startsAt)}</Td>
              <Td className="text-muted">{appointment.serviceName ?? '—'}</Td>
              <Td className="text-muted">{appointment.reason ?? '—'}</Td>
              <Td>
                <Badge className={appointmentStatusTone[appointment.status]}>
                  {appointmentStatusLabels[appointment.status]}
                </Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  );
}

// ───────────────────────── الحالات ─────────────────────────

export function CasesPanel({ patient, canWrite }: { patient: Patient; canWrite: boolean }) {
  const router = useRouter();
  const { call, busy } = useApi();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', diagnosis: '', teeth: '', description: '', treatment: '', expectedEndDate: '' });

  async function submit() {
    const teeth = form.teeth
      .split(/[\s,،]+/)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 11 && value <= 48);

    const done = await call(
      '/api/cases',
      json({
        patientId: patient.id,
        title: form.title,
        diagnosis: form.diagnosis || undefined,
        teeth,
        description: form.description || undefined,
        treatment: form.treatment || undefined,
        expectedEndDate: form.expectedEndDate || undefined,
      }),
      'تم إنشاء الحالة.',
    );
    if (done) {
      setOpen(false);
      setForm({ title: '', diagnosis: '', teeth: '', description: '', treatment: '', expectedEndDate: '' });
    }
  }

  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="flex justify-end">
          <Button onClick={() => setOpen(true)}>
            <Plus size={17} />
            حالة جديدة
          </Button>
        </div>
      )}

      {patient.cases.length === 0 ? (
        <EmptyState title="لا توجد حالات" description="أنشئي حالة لتتبّع تشخيص وعلاج محدد." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {patient.cases.map((item) => (
            <Card key={item.id}>
              <CardHeader
                title={item.title}
                description={`بدأت في ${formatShortDate(item.startDate)}`}
                action={
                  <div className="flex items-center gap-1">
                    <Badge className="border-orchid-200 bg-orchid-50 text-orchid-700">{caseStatusLabels[item.status]}</Badge>
                    {canWrite && (
                      <DeleteButton
                        endpoint={`/api/cases/${item.id}`}
                        title="حذف الحالة"
                        message={`سيتم حذف الحالة «${item.title}».`}
                        onDeleted={() => router.refresh()}
                      />
                    )}
                  </div>
                }
              />
              <CardBody className="space-y-3 text-sm">
                {item.diagnosis && <p><span className="text-muted">التشخيص: </span>{item.diagnosis}</p>}
                {item.teeth.length > 0 && (
                  <p>
                    <span className="text-muted">الأسنان: </span>
                    {item.teeth.join('، ')}
                  </p>
                )}
                {item.description && <p className="leading-7 text-muted">{item.description}</p>}
                {item.treatment && <p><span className="text-muted">العلاج: </span>{item.treatment}</p>}
                {item.expectedEndDate && (
                  <p className="text-xs text-muted">الإنجاز المتوقع: {formatShortDate(item.expectedEndDate)}</p>
                )}
                {canWrite && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(['IN_TREATMENT', 'COMPLETED', 'ON_HOLD'] as const).map((status) => (
                      <Button
                        key={status}
                        variant="secondary"
                        size="sm"
                        disabled={busy || item.status === status}
                        onClick={() =>
                          call(
                            `/api/cases/${item.id}`,
                            { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) },
                            `تم تحديث الحالة إلى «${caseStatusLabels[status]}».`,
                          )
                        }
                      >
                        {caseStatusLabels[status]}
                      </Button>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="حالة جديدة"
        footer={
          <>
            <button onClick={() => setOpen(false)} className="h-10 rounded-xl px-4 text-sm text-muted hover:bg-orchid-50">
              تراجع
            </button>
            <Button size="sm" loading={busy} disabled={form.title.trim().length < 3} onClick={submit}>
              حفظ
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="case-title" required>
              اسم الحالة
            </Label>
            <Input
              id="case-title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="مثال: علاج تسوس الأسنان"
            />
          </div>
          <div>
            <Label htmlFor="case-diagnosis">التشخيص</Label>
            <Input id="case-diagnosis" value={form.diagnosis} onChange={(e) => setForm((prev) => ({ ...prev, diagnosis: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="case-teeth">أرقام الأسنان</Label>
            <Input
              id="case-teeth"
              dir="ltr"
              value={form.teeth}
              onChange={(e) => setForm((prev) => ({ ...prev, teeth: e.target.value }))}
              placeholder="16, 26, 36"
            />
            <p className="mt-1.5 text-xs text-muted">ترقيم FDI، مفصولة بفواصل.</p>
          </div>
          <div>
            <Label htmlFor="case-description">الوصف</Label>
            <Textarea id="case-description" rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="case-treatment">العلاج</Label>
            <Textarea id="case-treatment" rows={2} value={form.treatment} onChange={(e) => setForm((prev) => ({ ...prev, treatment: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="case-end">الإنجاز المتوقع</Label>
            <Input id="case-end" type="date" value={form.expectedEndDate} onChange={(e) => setForm((prev) => ({ ...prev, expectedEndDate: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ───────────────────────── خطط العلاج ─────────────────────────

type DraftItem = { procedure: string; toothNumber: string; estimatedCost: string; notes: string };

export function PlansPanel({ patient, canWrite }: { patient: Patient; canWrite: boolean }) {
  const router = useRouter();
  const { call, busy } = useApi();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [items, setItems] = React.useState<DraftItem[]>([{ procedure: '', toothNumber: '', estimatedCost: '', notes: '' }]);

  function updateItem(index: number, key: keyof DraftItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  async function submit() {
    const payload = {
      patientId: patient.id,
      title,
      items: items
        .filter((item) => item.procedure.trim().length >= 2)
        .map((item) => ({
          procedure: item.procedure,
          toothNumber: item.toothNumber ? Number(item.toothNumber) : undefined,
          estimatedCost: Number(item.estimatedCost || 0),
          notes: item.notes || undefined,
        })),
    };
    const done = await call('/api/treatment-plans', json(payload), 'تم إنشاء خطة العلاج.');
    if (done) {
      setOpen(false);
      setTitle('');
      setItems([{ procedure: '', toothNumber: '', estimatedCost: '', notes: '' }]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-muted">
            إجمالي التكلفة: <b className="text-ink">{formatMoney(patient.balance.charged)}</b>
          </span>
          <span className="text-muted">
            المدفوع: <b className="text-ok">{formatMoney(patient.balance.paid)}</b>
          </span>
          <span className="text-muted">
            الرصيد المتبقي: <b className={patient.balance.balance > 0 ? 'text-danger' : 'text-ink'}>{formatMoney(patient.balance.balance)}</b>
          </span>
        </div>
        {canWrite && (
          <Button onClick={() => setOpen(true)}>
            <Plus size={17} />
            خطة علاج جديدة
          </Button>
        )}
      </div>

      {patient.plans.length === 0 ? (
        <EmptyState title="لا توجد خطط علاج" description="أنشئي خطة لتوثيق الإجراءات وتكاليفها المتوقعة." />
      ) : (
        patient.plans.map((plan) => {
          const estimated = plan.items.reduce((sum, item) => sum + (item.actualCost ?? item.estimatedCost), 0);
          return (
            <Card key={plan.id}>
              <CardHeader
                title={plan.title}
                description={`أُنشئت في ${formatShortDate(plan.createdAt)} · الإجمالي ${formatMoney(estimated)}`}
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-orchid-200 bg-orchid-50 text-orchid-700">{planStatusLabels[plan.status]}</Badge>
                    {canWrite && (
                      <DeleteButton
                        endpoint={`/api/treatment-plans/${plan.id}`}
                        title="حذف خطة العلاج"
                        message={`سيتم حذف خطة «${plan.title}».`}
                        onDeleted={() => router.refresh()}
                      />
                    )}
                    {canWrite &&
                      (['APPROVED', 'IN_PROGRESS', 'COMPLETED'] as const).map((status) => (
                        <Button
                          key={status}
                          variant="secondary"
                          size="sm"
                          disabled={busy || plan.status === status}
                          onClick={() =>
                            call(
                              `/api/treatment-plans/${plan.id}`,
                              { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) },
                              `تم تحديث الخطة إلى «${planStatusLabels[status]}».`,
                            )
                          }
                        >
                          {planStatusLabels[status]}
                        </Button>
                      ))}
                  </div>
                }
              />
              <TableWrap>
                <thead>
                  <tr>
                    <Th>الإجراء</Th>
                    <Th>السن</Th>
                    <Th>التكلفة المتوقعة</Th>
                    <Th>التكلفة الفعلية</Th>
                    <Th>الحالة</Th>
                    {canWrite && <Th>تحديث</Th>}
                  </tr>
                </thead>
                <tbody>
                  {plan.items.map((item) => (
                    <tr key={item.id}>
                      <Td>
                        <span className="font-medium">{item.procedure}</span>
                        {item.notes && <span className="block text-xs text-muted">{item.notes}</span>}
                      </Td>
                      <Td className="text-muted">{item.toothNumber ?? '—'}</Td>
                      <Td className="tabular-nums">{formatMoney(item.estimatedCost)}</Td>
                      <Td className="tabular-nums">{item.actualCost === null ? '—' : formatMoney(item.actualCost)}</Td>
                      <Td>
                        <Badge className="border-line bg-canvas text-muted">{itemStatusLabels[item.status]}</Badge>
                      </Td>
                      {canWrite && (
                        <Td>
                          <Select
                            aria-label="تحديث حالة الإجراء"
                            value={item.status}
                            className="h-9 w-32 py-0 pl-7 text-xs"
                            onChange={(e) =>
                              call(
                                `/api/treatment-plan-items/${item.id}`,
                                {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: e.target.value }),
                                },
                                'تم تحديث الإجراء.',
                              )
                            }
                          >
                            {Object.entries(itemStatusLabels).map(([key, value]) => (
                              <option key={key} value={key}>
                                {value}
                              </option>
                            ))}
                          </Select>
                        </Td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Card>
          );
        })
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="خطة علاج جديدة"
        footer={
          <>
            <button onClick={() => setOpen(false)} className="h-10 rounded-xl px-4 text-sm text-muted hover:bg-orchid-50">
              تراجع
            </button>
            <Button size="sm" loading={busy} disabled={title.trim().length < 3} onClick={submit}>
              حفظ الخطة
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="plan-title" required>
              اسم الخطة
            </Label>
            <Input id="plan-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="خطة علاج شاملة" />
          </div>

          <div className="space-y-3">
            <Label>الإجراءات</Label>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-2 gap-2 rounded-xl border border-line p-3">
                <Input
                  placeholder="الإجراء"
                  value={item.procedure}
                  onChange={(e) => updateItem(index, 'procedure', e.target.value)}
                  className="col-span-2"
                />
                <Input
                  placeholder="رقم السن"
                  dir="ltr"
                  inputMode="numeric"
                  value={item.toothNumber}
                  onChange={(e) => updateItem(index, 'toothNumber', e.target.value)}
                />
                <Input
                  placeholder="التكلفة المتوقعة"
                  dir="ltr"
                  inputMode="decimal"
                  value={item.estimatedCost}
                  onChange={(e) => updateItem(index, 'estimatedCost', e.target.value)}
                />
                <Input
                  placeholder="ملاحظة"
                  value={item.notes}
                  onChange={(e) => updateItem(index, 'notes', e.target.value)}
                  className="col-span-2"
                />
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setItems((prev) => [...prev, { procedure: '', toothNumber: '', estimatedCost: '', notes: '' }])}
            >
              <Plus size={16} />
              إضافة إجراء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ───────────────────────── الملاحظات السريرية ─────────────────────────

export function NotesPanel({ patient, canWrite }: { patient: Patient; canWrite: boolean }) {
  const router = useRouter();
  const { call, busy } = useApi();
  const [form, setForm] = React.useState({ content: '', diagnosis: '', treatment: '', recommendations: '', followUpAt: '' });

  async function submit() {
    const done = await call(
      `/api/patients/${patient.id}/clinical-notes`,
      json({
        patientId: patient.id,
        content: form.content,
        diagnosis: form.diagnosis || undefined,
        treatment: form.treatment || undefined,
        recommendations: form.recommendations || undefined,
        followUpAt: form.followUpAt || undefined,
      }),
      'تمت إضافة الملاحظة السريرية.',
    );
    if (done) setForm({ content: '', diagnosis: '', treatment: '', recommendations: '', followUpAt: '' });
  }

  return (
    <div className="space-y-5">
      {canWrite && (
        <Card>
          <CardHeader title="ملاحظة سريرية جديدة" description="تُحفظ بتاريخ ووقت، ولا يمكن للمريض تعديلها." />
          <CardBody className="space-y-4">
            <div>
              <Label htmlFor="note-content" required>
                نص الملاحظة
              </Label>
              <Textarea
                id="note-content"
                rows={3}
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="note-diagnosis">التشخيص</Label>
                <Input id="note-diagnosis" value={form.diagnosis} onChange={(e) => setForm((prev) => ({ ...prev, diagnosis: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="note-treatment">العلاج المنفّذ</Label>
                <Input id="note-treatment" value={form.treatment} onChange={(e) => setForm((prev) => ({ ...prev, treatment: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="note-reco">التوصيات</Label>
                <Input id="note-reco" value={form.recommendations} onChange={(e) => setForm((prev) => ({ ...prev, recommendations: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="note-followup">موعد المراجعة</Label>
                <Input id="note-followup" type="date" value={form.followUpAt} onChange={(e) => setForm((prev) => ({ ...prev, followUpAt: e.target.value }))} />
              </div>
            </div>
            <Button loading={busy} disabled={form.content.trim().length < 3} onClick={submit}>
              حفظ الملاحظة
            </Button>
          </CardBody>
        </Card>
      )}

      {patient.notes_clinical.length === 0 ? (
        <EmptyState title="لا توجد ملاحظات سريرية" description="ستظهر هنا كل الملاحظات مرتّبة من الأحدث." />
      ) : (
        <ol className="space-y-4">
          {patient.notes_clinical.map((note) => (
            <li key={note.id} className="card px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{note.dentistName ?? 'العيادة'}</p>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted">
                    {formatArabicDate(note.createdAt)} · {formatArabicTime(note.createdAt)}
                  </p>
                  {canWrite && (
                    <DeleteButton
                      endpoint={`/api/clinical-notes/${note.id}`}
                      title="حذف الملاحظة"
                      message="سيتم حذف هذه الملاحظة السريرية نهائياً."
                      onDeleted={() => router.refresh()}
                    />
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm leading-8">{note.content}</p>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {note.diagnosis && <p><span className="text-muted">التشخيص: </span>{note.diagnosis}</p>}
                {note.treatment && <p><span className="text-muted">العلاج: </span>{note.treatment}</p>}
                {note.recommendations && <p><span className="text-muted">التوصيات: </span>{note.recommendations}</p>}
                {note.followUpAt && <p><span className="text-muted">المراجعة: </span>{formatShortDate(note.followUpAt)}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ───────────────────────── المدفوعات ─────────────────────────

export function PaymentsPanel({ patient, canWrite }: { patient: Patient; canWrite: boolean }) {
  const router = useRouter();
  const { call, busy } = useApi();
  const [form, setForm] = React.useState({ amount: '', method: 'CASH', paidAt: '', notes: '' });

  async function submit() {
    const done = await call(
      '/api/payments',
      json({
        patientId: patient.id,
        amount: Number(form.amount),
        method: form.method,
        paidAt: form.paidAt || undefined,
        notes: form.notes || undefined,
      }),
      'تم تسجيل الدفعة.',
    );
    if (done) setForm({ amount: '', method: 'CASH', paidAt: '', notes: '' });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="card px-5 py-4">
          <p className="text-sm text-muted">إجمالي العلاجات</p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{formatMoney(patient.balance.charged)}</p>
        </div>
        <div className="card px-5 py-4">
          <p className="text-sm text-muted">المدفوع</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-ok">{formatMoney(patient.balance.paid)}</p>
        </div>
        <div className="card px-5 py-4">
          <p className="text-sm text-muted">الرصيد المتبقي</p>
          <p className={cn('mt-2 text-xl font-semibold tabular-nums', patient.balance.balance > 0 && 'text-danger')}>
            {formatMoney(patient.balance.balance)}
          </p>
        </div>
      </div>

      {canWrite && (
        <Card>
          <CardHeader title="تسجيل دفعة" />
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <Label htmlFor="pay-amount" required>
                  المبلغ
                </Label>
                <Input id="pay-amount" dir="ltr" inputMode="decimal" value={form.amount} onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="pay-method">طريقة الدفع</Label>
                <Select id="pay-method" value={form.method} onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value }))}>
                  {Object.entries(paymentMethodLabels).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="pay-date">التاريخ</Label>
                <Input id="pay-date" type="date" value={form.paidAt} onChange={(e) => setForm((prev) => ({ ...prev, paidAt: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="pay-notes">ملاحظات</Label>
                <Input id="pay-notes" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </div>
            </div>
            <Button loading={busy} disabled={!Number(form.amount)} onClick={submit}>
              تسجيل الدفعة
            </Button>
          </CardBody>
        </Card>
      )}

      {patient.payments.length === 0 ? (
        <EmptyState title="لا توجد مدفوعات مسجّلة" />
      ) : (
        <Card>
          <CardHeader title="سجل المدفوعات" />
          <TableWrap>
            <thead>
              <tr>
                <Th>التاريخ</Th>
                <Th>المبلغ</Th>
                <Th>الطريقة</Th>
                <Th>ملاحظات</Th>
                {canWrite && <Th className="w-10"><span className="sr-only">حذف</span></Th>}
              </tr>
            </thead>
            <tbody>
              {patient.payments.map((payment) => (
                <tr key={payment.id}>
                  <Td>{formatShortDate(payment.paidAt)}</Td>
                  <Td className="tabular-nums font-medium">{formatMoney(payment.amount)}</Td>
                  <Td className="text-muted">{paymentMethodLabels[payment.method]}</Td>
                  <Td className="text-muted">{payment.notes ?? '—'}</Td>
                  {canWrite && (
                    <Td>
                      <DeleteButton
                        endpoint={`/api/payments/${payment.id}`}
                        title="حذف الدفعة"
                        message={`سيتم حذف دفعة بقيمة ${formatMoney(payment.amount)} وسيتغير رصيد المريض.`}
                        onDeleted={() => router.refresh()}
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

// ───────────────────────── الملفات والصور ─────────────────────────

const IMAGE_KINDS: FileKind[] = ['BEFORE', 'AFTER', 'XRAY', 'CLINICAL'];

export function FilesPanel({
  patient,
  canWrite,
  imagesOnly,
}: {
  patient: Patient;
  canWrite: boolean;
  imagesOnly?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [kind, setKind] = React.useState<FileKind>(imagesOnly ? 'BEFORE' : 'DOCUMENT');
  const [uploading, setUploading] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<{ id: string; name: string } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const files = patient.files.filter((file) =>
    imagesOnly ? IMAGE_KINDS.includes(file.kind) : !IMAGE_KINDS.includes(file.kind) || file.kind === 'DOCUMENT',
  );

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('kind', kind);
      const response = await fetch(`/api/patients/${patient.id}/files`, { method: 'POST', body });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.push(payload.error ?? 'تعذر رفع الملف.', 'error');
        return;
      }
      toast.push('تم رفع الملف.');
      router.refresh();
    } catch {
      toast.push('تعذر الاتصال بالخادم.', 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function remove(id: string) {
    const response = await fetch(`/api/files/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      toast.push('تعذر حذف الملف.', 'error');
      return;
    }
    toast.push('تمت أرشفة الملف.');
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {canWrite && (
        <Card>
          <CardHeader title={imagesOnly ? 'رفع صورة أو أشعة' : 'رفع مستند'} description="الصيغ المسموحة: JPG، PNG، WebP، PDF." />
          <CardBody className="flex flex-wrap items-end gap-3">
            <div className="w-48">
              <Label htmlFor="file-kind">نوع الملف</Label>
              <Select id="file-kind" value={kind} onChange={(e) => setKind(e.target.value as FileKind)}>
                {(imagesOnly ? IMAGE_KINDS : (['DOCUMENT', ...IMAGE_KINDS] as FileKind[])).map((item) => (
                  <option key={item} value={item}>
                    {fileKindLabels[item]}
                  </option>
                ))}
              </Select>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              className="hidden"
              id="file-input"
            />
            <Button loading={uploading} onClick={() => inputRef.current?.click()}>
              <Upload size={17} />
              اختيار ملف ورفعه
            </Button>
          </CardBody>
        </Card>
      )}

      {files.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} />}
          title={imagesOnly ? 'لا توجد صور أو أشعة' : 'لا توجد مستندات'}
          description="يمكن رفع صور ما قبل وبعد العلاج، صور الأشعة، والمستندات."
        />
      ) : imagesOnly ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((file) => (
            <figure key={file.id} className="card overflow-hidden">
              <button onClick={() => setPreview({ id: file.id, name: file.name })} className="block w-full">
                {/* الملفات تُقدَّم عبر مسار محمي يتحقق من الصلاحية */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/${file.id}`}
                  alt={file.name}
                  loading="lazy"
                  className="h-36 w-full bg-orchid-50 object-cover"
                />
              </button>
              <figcaption className="flex items-center justify-between px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{fileKindLabels[file.kind]}</p>
                  <p className="text-[11px] text-muted">{formatShortDate(file.createdAt)}</p>
                </div>
                {canWrite && (
                  <button onClick={() => setDeleteTarget(file.id)} aria-label="حذف" className="p-1 text-muted hover:text-danger">
                    <Trash2 size={15} />
                  </button>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <Card>
          <TableWrap>
            <thead>
              <tr>
                <Th>الاسم</Th>
                <Th>النوع</Th>
                <Th>الحجم</Th>
                <Th>تاريخ الرفع</Th>
                <Th>إجراءات</Th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <Td className="font-medium">{file.name}</Td>
                  <Td className="text-muted">{fileKindLabels[file.kind]}</Td>
                  <Td className="tabular-nums text-muted">{Math.round(file.sizeBytes / 1024)} ك.ب</Td>
                  <Td className="text-muted">{formatShortDate(file.createdAt)}</Td>
                  <Td>
                    <div className="flex gap-3">
                      <a href={`/api/files/${file.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-orchid-600 hover:underline">
                        <Download size={15} />
                        فتح
                      </a>
                      {canWrite && (
                        <button onClick={() => setDeleteTarget(file.id)} className="text-sm text-danger hover:underline">
                          حذف
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      )}

      {preview && (
        <Modal open onClose={() => setPreview(null)} title={preview.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/files/${preview.id}`} alt={preview.name} className="w-full rounded-xl" />
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف الملف"
        message="سيُحذف الملف نهائياً من ملف المريض ومن الخادم. هل تريدين المتابعة؟"
        confirmLabel="أرشفة الملف"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && remove(deleteTarget)}
      />
    </div>
  );
}

// ───────────────────────── نظرة عامة ─────────────────────────

export function OverviewPanel({ patient, clinical }: { patient: Patient; clinical: boolean }) {
  const now = Date.now();
  const next = [...patient.appointments]
    .filter((a) => new Date(a.startsAt).getTime() > now && !['CANCELLED', 'NO_SHOW'].includes(a.status))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
  const last = patient.appointments.find((a) => new Date(a.startsAt).getTime() <= now);
  const openCases = patient.cases.filter((c) => c.status === 'OPEN' || c.status === 'IN_TREATMENT');
  const activePlan = patient.plans.find((p) => p.status === 'IN_PROGRESS' || p.status === 'APPROVED');
  const flaggedTeeth = patient.chartRecords.filter((r) => r.condition !== 'HEALTHY');

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title="المواعيد" />
        <CardBody className="space-y-3 text-sm">
          <p>
            <span className="text-muted">الموعد القادم: </span>
            {next ? `${formatArabicDate(next.startsAt)} — ${formatArabicTime(next.startsAt)}` : 'لا يوجد'}
          </p>
          <p>
            <span className="text-muted">آخر زيارة: </span>
            {last ? formatArabicDate(last.startsAt) : 'لا توجد'}
          </p>
          <p>
            <span className="text-muted">إجمالي المواعيد: </span>
            {patient.appointments.length}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="الوضع المالي" />
        <CardBody className="space-y-3 text-sm">
          <p>
            <span className="text-muted">إجمالي العلاجات: </span>
            {formatMoney(patient.balance.charged)}
          </p>
          <p>
            <span className="text-muted">المدفوع: </span>
            {formatMoney(patient.balance.paid)}
          </p>
          <p>
            <span className="text-muted">الرصيد المتبقي: </span>
            <b className={patient.balance.balance > 0 ? 'text-danger' : undefined}>{formatMoney(patient.balance.balance)}</b>
          </p>
        </CardBody>
      </Card>

      {clinical && (
        <>
          <Card>
            <CardHeader title="الحالات المفتوحة" />
            <CardBody className="space-y-2 text-sm">
              {openCases.length === 0 ? (
                <p className="text-muted">لا توجد حالات مفتوحة.</p>
              ) : (
                openCases.map((item) => (
                  <p key={item.id}>
                    {item.title} — <span className="text-muted">{caseStatusLabels[item.status]}</span>
                  </p>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="خطة العلاج الحالية" />
            <CardBody className="space-y-2 text-sm">
              {activePlan ? (
                <>
                  <p className="font-medium">{activePlan.title}</p>
                  <p className="text-muted">
                    {activePlan.items.filter((i) => i.status === 'COMPLETED').length} من {activePlan.items.length} إجراء مكتمل
                  </p>
                </>
              ) : (
                <p className="text-muted">لا توجد خطة نشطة.</p>
              )}
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="ملخص مخطط الأسنان" description={`${flaggedTeeth.length} سن مسجّل بحالة غير سليمة.`} />
            <CardBody>
              {flaggedTeeth.length === 0 ? (
                <p className="text-sm text-muted">كل الأسنان المسجّلة سليمة.</p>
              ) : (
                <ul className="grid gap-2 text-sm sm:grid-cols-2">
                  {flaggedTeeth.map((record) => (
                    <li key={record.toothNumber} className="flex items-center justify-between rounded-lg bg-orchid-50/50 px-3 py-2">
                      <span>
                        {record.toothNumber} — {toothName(record.toothNumber)}
                      </span>
                      <span className="text-muted">{record.notes ?? ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {!clinical && (
        <Card className="lg:col-span-2">
          <CardBody>
            <SuccessNote>
              أنت مسجّلة كموظفة استقبال: تظهر لك بيانات التواصل والمواعيد والمدفوعات فقط، دون المعلومات السريرية.
            </SuccessNote>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

