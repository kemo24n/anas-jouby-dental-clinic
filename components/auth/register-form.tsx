'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/field';
import { ErrorNote } from '@/components/ui/states';

type Fields = Record<string, string>;

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = React.useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    birthDate: '',
  });
  const [fieldErrors, setFieldErrors] = React.useState<Fields>({});
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'تعذر إنشاء الحساب.');
        setFieldErrors(payload.fieldErrors ?? {});
        return;
      }
      router.push(payload.data.redirectTo);
      router.refresh();
    } catch {
      setError('تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">إنشاء حساب</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          تابع مواعيدك وخطة علاجك ومستنداتك من مكان واحد.
        </p>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div>
        <Label htmlFor="fullName" required>
          الاسم الكامل
        </Label>
        <Input id="fullName" required value={form.fullName} onChange={set('fullName')} error={fieldErrors.fullName} />
      </div>

      <div>
        <Label htmlFor="phone" required>
          رقم الموبايل
        </Label>
        <Input
          id="phone"
          type="tel"
          dir="ltr"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={14}
          required
          placeholder="09XXXXXXXX"
          value={form.phone}
          onChange={set('phone')}
          error={fieldErrors.phone}
        />
        <p className="mt-1.5 text-xs text-muted">ستستخدم هذا الرقم لتسجيل الدخول.</p>
      </div>

      <div>
        <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
        <Input id="email" type="email" dir="ltr" value={form.email} onChange={set('email')} error={fieldErrors.email} />
      </div>

      <div>
        <Label htmlFor="birthDate">تاريخ الميلاد</Label>
        <Input id="birthDate" type="date" value={form.birthDate} onChange={set('birthDate')} error={fieldErrors.birthDate} />
      </div>

      <div>
        <Label htmlFor="password" required>
          كلمة المرور
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={set('password')}
          error={fieldErrors.password}
        />
        <p className="mt-1.5 text-xs text-muted">ثمانية أحرف على الأقل، مع حرف ورقم.</p>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        إنشاء الحساب
      </Button>

      <p className="text-sm text-muted">
        لديك حساب بالفعل؟{' '}
        <Link href="/login" className="font-medium text-orchid-600 hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
