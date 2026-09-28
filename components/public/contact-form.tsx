'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/field';
import { ErrorNote, SuccessNote } from '@/components/ui/states';

export function ContactForm() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState('sending');
    setError('');
    setFieldErrors({});
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error);
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        setState('idle');
        return;
      }
      setState('sent');
      setForm({ name: '', phone: '', email: '', subject: '', message: '' });
    } catch {
      setError('تعذّر إرسال الرسالة. يرجى المحاولة مرة أخرى.');
      setState('idle');
    }
  }

  if (state === 'sent') {
    return <SuccessNote>وصلتنا رسالتك. سنعاود التواصل معك خلال ساعات الدوام.</SuccessNote>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" required>الاسم</Label>
          <Input id="name" value={form.name} error={fieldErrors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="cphone" required>الهاتف</Label>
          <Input id="cphone" dir="ltr" inputMode="tel" value={form.phone} error={fieldErrors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cemail">البريد الإلكتروني</Label>
          <Input id="cemail" type="email" dir="ltr" value={form.email} error={fieldErrors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="subject">الموضوع</Label>
          <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </div>
      </div>
      <div>
        <Label htmlFor="message" required>الرسالة</Label>
        <Textarea id="message" value={form.message} error={fieldErrors.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      </div>
      <Button type="submit" loading={state === 'sending'}>إرسال الرسالة</Button>
    </form>
  );
}
