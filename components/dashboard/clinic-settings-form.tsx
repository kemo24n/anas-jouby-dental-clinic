'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Checkbox, Input, Label, Textarea } from '@/components/ui/field';
import { ErrorNote, SkeletonRows } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { weekdayLabels } from '@/lib/labels';

type Settings = {
  clinicName: string;
  dentistName: string;
  tagline: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  slotMinutes: number;
  bufferMinutes: number;
  cancellationPolicy: string;
  heroTitle: string;
  heroSubtitle: string;
};

type WorkingHour = {
  weekday: number;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  isClosed: boolean;
};

export function ClinicSettingsForm() {
  const toast = useToast();
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [hours, setHours] = React.useState<WorkingHour[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [hoursBusy, setHoursBusy] = React.useState(false);

  React.useEffect(() => {
    Promise.all([fetch('/api/settings').then((r) => r.json()), fetch('/api/settings/working-hours').then((r) => r.json())])
      .then(([settingsPayload, hoursPayload]) => {
        setSettings(settingsPayload.data);
        const byDay = new Map<number, WorkingHour>(hoursPayload.data.map((h: WorkingHour) => [h.weekday, h]));
        setHours(
          Array.from({ length: 7 }, (_, weekday) => byDay.get(weekday) ?? { weekday, startTime: '09:00', endTime: '17:00', breakStart: null, breakEnd: null, isClosed: true }),
        );
      })
      .catch(() => setError('تعذر تحميل الإعدادات.'));
  }, []);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function saveSettings() {
    if (!settings) return;
    setBusy(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.push(payload.error ?? 'تعذر حفظ الإعدادات.', 'error');
        return;
      }
      toast.push('تم حفظ إعدادات العيادة.');
    } catch {
      toast.push('تعذر الاتصال بالخادم.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function saveHours() {
    if (!hours) return;
    setHoursBusy(true);
    try {
      const response = await fetch('/api/settings/working-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hours.map((h) => ({ ...h, breakStart: h.breakStart || '', breakEnd: h.breakEnd || '' }))),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.push(payload.error ?? 'تعذر حفظ ساعات الدوام.', 'error');
        return;
      }
      toast.push('تم حفظ ساعات الدوام.');
    } catch {
      toast.push('تعذر الاتصال بالخادم.', 'error');
    } finally {
      setHoursBusy(false);
    }
  }

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!settings || !hours) return <SkeletonRows rows={8} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="معلومات العيادة" />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="s-clinic">اسم العيادة</Label>
              <Input id="s-clinic" value={settings.clinicName} onChange={(e) => set('clinicName', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="s-dentist">اسم الطبيبة</Label>
              <Input id="s-dentist" value={settings.dentistName} onChange={(e) => set('dentistName', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="s-phone">الهاتف</Label>
              <Input id="s-phone" dir="ltr" value={settings.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="s-whatsapp">واتساب</Label>
              <Input id="s-whatsapp" dir="ltr" value={settings.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="s-email">البريد الإلكتروني</Label>
              <Input id="s-email" dir="ltr" value={settings.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="s-address">العنوان</Label>
              <Input id="s-address" value={settings.address} onChange={(e) => set('address', e.target.value)} />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="واجهة الموقع" description="النص الرئيسي في الصفحة الرئيسية." />
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="s-hero-title">العنوان الرئيسي</Label>
            <Input id="s-hero-title" value={settings.heroTitle} onChange={(e) => set('heroTitle', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="s-hero-subtitle">الوصف الفرعي</Label>
            <Textarea id="s-hero-subtitle" rows={2} value={settings.heroSubtitle} onChange={(e) => set('heroSubtitle', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="s-policy">سياسة الإلغاء</Label>
            <Textarea id="s-policy" rows={2} value={settings.cancellationPolicy} onChange={(e) => set('cancellationPolicy', e.target.value)} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="التواصل الاجتماعي" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="s-instagram">إنستغرام</Label>
            <Input id="s-instagram" dir="ltr" value={settings.instagram ?? ''} onChange={(e) => set('instagram', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="s-facebook">فيسبوك</Label>
            <Input id="s-facebook" dir="ltr" value={settings.facebook ?? ''} onChange={(e) => set('facebook', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="s-tiktok">تيك توك</Label>
            <Input id="s-tiktok" dir="ltr" value={settings.tiktok ?? ''} onChange={(e) => set('tiktok', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="s-youtube">يوتيوب</Label>
            <Input id="s-youtube" dir="ltr" value={settings.youtube ?? ''} onChange={(e) => set('youtube', e.target.value)} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="إعدادات الحجز" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="s-slot">مدة الفترة الزمنية (دقيقة)</Label>
            <Input id="s-slot" type="number" min={5} value={settings.slotMinutes} onChange={(e) => set('slotMinutes', Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="s-buffer">وقت فاصل بين المواعيد (دقيقة)</Label>
            <Input id="s-buffer" type="number" min={0} value={settings.bufferMinutes} onChange={(e) => set('bufferMinutes', Number(e.target.value))} />
          </div>
        </CardBody>
      </Card>

      <Button loading={busy} onClick={saveSettings}>
        حفظ إعدادات العيادة
      </Button>

      <Card>
        <CardHeader title="ساعات الدوام" description="حدّدي أيام الدوام وفترة الاستراحة لكل يوم." />
        <CardBody className="space-y-3">
          {hours.map((hour, index) => (
            <div key={hour.weekday} className="grid grid-cols-2 items-center gap-3 rounded-xl border border-line p-3 sm:grid-cols-6">
              <p className="text-sm font-medium sm:col-span-1">{weekdayLabels[hour.weekday]}</p>
              <Checkbox
                label="مغلق"
                checked={hour.isClosed}
                onChange={(e) =>
                  setHours((prev) => prev!.map((h, i) => (i === index ? { ...h, isClosed: e.target.checked } : h)))
                }
              />
              {!hour.isClosed && (
                <>
                  <Input
                    type="time"
                    value={hour.startTime}
                    onChange={(e) => setHours((prev) => prev!.map((h, i) => (i === index ? { ...h, startTime: e.target.value } : h)))}
                  />
                  <Input
                    type="time"
                    value={hour.endTime}
                    onChange={(e) => setHours((prev) => prev!.map((h, i) => (i === index ? { ...h, endTime: e.target.value } : h)))}
                  />
                  <Input
                    type="time"
                    value={hour.breakStart ?? ''}
                    placeholder="بداية الاستراحة"
                    onChange={(e) => setHours((prev) => prev!.map((h, i) => (i === index ? { ...h, breakStart: e.target.value } : h)))}
                  />
                  <Input
                    type="time"
                    value={hour.breakEnd ?? ''}
                    placeholder="نهاية الاستراحة"
                    onChange={(e) => setHours((prev) => prev!.map((h, i) => (i === index ? { ...h, breakEnd: e.target.value } : h)))}
                  />
                </>
              )}
            </div>
          ))}
          <Button loading={hoursBusy} onClick={saveHours}>
            حفظ ساعات الدوام
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
