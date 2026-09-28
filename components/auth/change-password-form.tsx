'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/field';
import { ErrorNote, SuccessNote } from '@/components/ui/states';

export function ChangePasswordForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'تعذر تغيير كلمة المرور.');
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 900);
    } catch {
      setError('تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">تغيير كلمة المرور</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          لحماية حسابك، يرجى تعيين كلمة مرور جديدة بدل كلمة المرور الافتراضية.
        </p>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {done && <SuccessNote>تم تغيير كلمة المرور بنجاح.</SuccessNote>}

      <div>
        <Label htmlFor="current" required>
          كلمة المرور الحالية
        </Label>
        <Input
          id="current"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="new" required>
          كلمة المرور الجديدة
        </Label>
        <Input id="new" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="confirm" required>
          تأكيد كلمة المرور الجديدة
        </Label>
        <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        حفظ كلمة المرور
      </Button>
    </form>
  );
}
