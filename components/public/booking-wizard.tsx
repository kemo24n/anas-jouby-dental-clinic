'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, Clock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/field';
import { ErrorNote } from '@/components/ui/states';
import { formatArabicDate, formatArabicTime, toDateKey } from '@/lib/utils';
import { whatsappLink, WA_MESSAGES } from '@/lib/whatsapp';

type Service = { id: string; name: string; durationMin: number; startingPrice: string | null };
type Category = { id: string; name: string; services: Service[] };

type Confirmation = {
  code: string;
  startsAt: string;
  serviceName: string | null;
  dentistName: string;
  patientName: string;
};

const steps = ['الخدمة', 'التاريخ والوقت', 'بياناتك', 'التأكيد'];

export function BookingWizard({
  categories,
  whatsapp,
  clinicName,
  prefill,
}: {
  categories: Category[];
  whatsapp: string;
  clinicName: string;
  prefill?: { fullName?: string; phone?: string; email?: string };
}) {
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState('');
  const [dateKey, setDateKey] = useState('');
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [form, setForm] = useState({
    fullName: prefill?.fullName ?? '',
    phone: prefill?.phone ?? '',
    email: prefill?.email ?? '',
    birthDate: '',
    reason: '',
    notes: '',
  });

  const allServices = useMemo(() => categories.flatMap((c) => c.services), [categories]);
  const service = allServices.find((s) => s.id === serviceId) ?? null;

  // الأيام القادمة المتاحة للاختيار (30 يوماً)
  const days = useMemo(() => {
    const list: { key: string; label: string; weekday: string; dayNum: number }[] = [];
    const names = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push({ key: toDateKey(d), label: formatArabicDate(d), weekday: names[d.getDay()], dayNum: d.getDate() });
    }
    return list;
  }, []);

  useEffect(() => {
    if (!dateKey || !serviceId) return;
    let cancelled = false;
    setLoadingSlots(true);
    setTime('');
    fetch(`/api/availability?date=${dateKey}&serviceId=${serviceId}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setSlots(json.ok ? json.data.slots : []);
      })
      .catch(() => !cancelled && setSlots([]))
      .finally(() => !cancelled && setLoadingSlots(false));
    return () => {
      cancelled = true;
    };
  }, [dateKey, serviceId]);

  async function submit() {
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, serviceId, date: dateKey, time }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error);
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        if (res.status === 409) {
          setStep(1);
          setTime('');
        }
        return;
      }
      setConfirmation(json.data);
      setStep(3);
    } catch {
      setError('تعذّر إتمام الحجز. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="card mx-auto max-w-xl p-7 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F3EC] text-[#417A5C]">
          <Check size={26} />
        </div>
        <h2 className="text-xl font-semibold">تم حجز موعدك بنجاح</h2>
        <p className="mt-2 text-sm text-muted">احتفظ برقم الموعد للمراجعة أو التعديل.</p>

        <dl className="mt-7 divide-y divide-line rounded-2xl border border-line text-right text-sm">
          <Row label="رقم الموعد" value={confirmation.code} />
          <Row label="التاريخ" value={formatArabicDate(confirmation.startsAt)} />
          <Row label="الوقت" value={formatArabicTime(confirmation.startsAt)} />
          <Row label="الخدمة" value={confirmation.serviceName ?? '—'} />
          <Row label="الطبيبة" value={confirmation.dentistName} />
          <Row label="العيادة" value={clinicName} />
        </dl>

        <a
          href={whatsappLink(WA_MESSAGES.confirmAppointment(confirmation.code), whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-medium text-white"
        >
          <MessageCircle size={18} />
          التواصل عبر واتساب
        </a>
        <p className="mt-4 text-xs leading-6 text-muted">
          يرجى الحضور قبل الموعد بعشر دقائق. لتعديل الموعد أو إلغائه، تواصل معنا قبل 24 ساعة.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-8 flex items-center justify-between gap-2 text-xs sm:text-sm" aria-label="مراحل الحجز">
        {steps.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                index <= step ? 'border-orchid-500 bg-orchid-500 text-white' : 'border-line bg-white text-muted'
              }`}
            >
              {index + 1}
            </span>
            <span className={index <= step ? 'text-ink' : 'text-muted'}>{label}</span>
            {index < steps.length - 1 && <span className="hidden h-px flex-1 bg-line sm:block" />}
          </li>
        ))}
      </ol>

      {error && <div className="mb-5"><ErrorNote>{error}</ErrorNote></div>}

      {step === 0 && (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id}>
              <h3 className="mb-3 text-sm font-semibold text-muted">{category.name}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {category.services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setServiceId(s.id);
                      setStep(1);
                    }}
                    className={`rounded-2xl border p-4 text-right transition-colors ${
                      serviceId === s.id ? 'border-orchid-400 bg-orchid-50' : 'border-line bg-white hover:border-orchid-300'
                    }`}
                  >
                    <span className="block font-medium">{s.name}</span>
                    <span className="mt-1.5 flex items-center gap-3 text-xs text-muted">
                      <span className="inline-flex items-center gap-1"><Clock size={13} /> {s.durationMin} دقيقة</span>
                      {s.startingPrice && <span>تبدأ من {Number(s.startingPrice)} $</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-7">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><CalendarDays size={16} /> اختر اليوم</h3>
            <div className="table-scroll flex gap-2 pb-2">
              {days.map((day) => (
                <button
                  key={day.key}
                  onClick={() => setDateKey(day.key)}
                  className={`min-w-[74px] shrink-0 rounded-xl border px-3 py-3 text-center text-sm ${
                    dateKey === day.key ? 'border-orchid-400 bg-orchid-50 text-orchid-700' : 'border-line bg-white'
                  }`}
                >
                  <span className="block text-xs text-muted">{day.weekday}</span>
                  <span className="mt-1 block text-lg font-semibold">{day.dayNum}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Clock size={16} /> اختر الوقت</h3>
            {!dateKey && <p className="text-sm text-muted">اختر اليوم أولاً لعرض الأوقات المتاحة.</p>}
            {dateKey && loadingSlots && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-11" />)}
              </div>
            )}
            {dateKey && !loadingSlots && slots.length === 0 && (
              <p className="rounded-xl border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-muted">
                لا توجد أوقات متاحة في هذا اليوم. جرّب يوماً آخر أو تواصل معنا عبر واتساب.
              </p>
            )}
            {dateKey && !loadingSlots && slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setTime(slot)}
                    className={`h-11 rounded-xl border text-sm ${
                      time === slot ? 'border-orchid-400 bg-orchid-500 text-white' : 'border-line bg-white hover:border-orchid-300'
                    }`}
                  >
                    <span dir="ltr">{slot}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(0)}><ChevronLeft size={16} /> تغيير الخدمة</Button>
            <Button disabled={!time} onClick={() => setStep(2)}>متابعة</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-orchid-200 bg-orchid-50/60 px-5 py-4 text-sm">
            <p className="font-medium">{service?.name}</p>
            <p className="mt-1 text-muted">
              {formatArabicDate(dateKey)} — <span dir="ltr">{time}</span> ({service?.durationMin} دقيقة)
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fullName" required>الاسم الكامل</Label>
              <Input id="fullName" value={form.fullName} error={fieldErrors.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="phone" required>رقم الهاتف</Label>
              <Input id="phone" dir="ltr" inputMode="tel" placeholder="09XXXXXXXX" value={form.phone} error={fieldErrors.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" dir="ltr" value={form.email} error={fieldErrors.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="birthDate">تاريخ الميلاد</Label>
              <Input id="birthDate" type="date" value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">سبب الزيارة</Label>
            <Input id="reason" value={form.reason} placeholder="مثال: ألم عند المضغ"
              onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات إضافية</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}><ChevronLeft size={16} /> تغيير الوقت</Button>
            <Button onClick={submit} loading={submitting} disabled={!form.fullName || !form.phone}>
              تأكيد الحجز
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
