'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/field';
import { ErrorNote } from '@/components/ui/states';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');

  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'تعذر تسجيل الدخول.');
        return;
      }
      const destination = payload.data.mustChangePassword
        ? '/change-password'
        : next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
          ? next
          : payload.data.redirectTo;
      router.push(destination);
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
        <h1 className="text-2xl font-semibold">تسجيل الدخول</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          ادخل برقم موبايلك وكلمة المرور.
        </p>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

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
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s]/g, ''))}
          placeholder="09XXXXXXXX"
        />
      </div>

      <div>
        <Label htmlFor="password" required>
          كلمة المرور
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        دخول
      </Button>

      <p className="text-sm text-muted">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="font-medium text-orchid-600 hover:underline">
          إنشاء حساب مريض
        </Link>
      </p>

      <p className="text-xs leading-6 text-muted">نسيت كلمة المرور؟ تواصل مع العيادة لإعادة تعيينها.</p>
    </form>
  );
}
