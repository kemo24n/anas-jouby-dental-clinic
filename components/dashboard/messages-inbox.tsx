'use client';
import { DeleteButton } from '@/components/dashboard/delete-button';

import * as React from 'react';
import { MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/field';
import { EmptyState, ErrorNote, SkeletonRows } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { contactStatusLabels } from '@/lib/labels';
import { formatArabicTime, formatShortDate, displayLocalPhone } from '@/lib/utils';
import { WA_MESSAGES, whatsappLink } from '@/lib/whatsapp';
import type { ContactStatus } from '@prisma/client';

type MessageRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  subject: string | null;
  message: string;
  status: ContactStatus;
  createdAt: string;
};

const TONE: Record<ContactStatus, string> = {
  NEW: 'border-orchid-200 bg-orchid-50 text-orchid-700',
  IN_PROGRESS: 'border-[#EDDFC2] bg-[#FDF3E3] text-[#8D7140]',
  ANSWERED: 'border-[#CDE6D8] bg-[#E8F3EC] text-[#417A5C]',
  CLOSED: 'border-line bg-canvas text-muted',
};

export function MessagesInbox() {
  const toast = useToast();
  const [rows, setRows] = React.useState<MessageRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/messages');
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'تعذر تحميل الرسائل.');
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

  async function updateStatus(id: string, status: ContactStatus) {
    const response = await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      toast.push('تعذر تحديث حالة الرسالة.', 'error');
      return;
    }
    toast.push('تم تحديث حالة الرسالة.');
    load();
  }

  return (
    <div className="space-y-4">
      {error && <ErrorNote>{error}</ErrorNote>}
      {rows === null && <SkeletonRows rows={6} />}

      {rows !== null && rows.length === 0 && !error && (
        <EmptyState icon={<MessageSquare size={28} />} title="لا توجد رسائل" description="ستظهر هنا رسائل نموذج التواصل من الموقع العام." />
      )}

      {rows?.map((row) => (
        <Card key={row.id} className="px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{row.name}</p>
              <p dir="ltr" className="text-right text-xs text-muted">
                {displayLocalPhone(row.phone)} {row.email ? `· ${row.email}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={TONE[row.status]}>{contactStatusLabels[row.status]}</Badge>
              <Select
                aria-label="تحديث الحالة"
                value={row.status}
                onChange={(e) => updateStatus(row.id, e.target.value as ContactStatus)}
                className="h-9 w-36 py-0 pl-7 text-xs"
              >
                {Object.entries(contactStatusLabels).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </Select>
              <DeleteButton
                endpoint={`/api/messages/${row.id}`}
                title="حذف الرسالة"
                message={`سيتم حذف رسالة ${row.name} نهائياً.`}
                onDeleted={load}
              />
            </div>
          </div>
          {row.subject && <p className="mt-2 text-sm font-medium">{row.subject}</p>}
          <p className="mt-1.5 text-sm leading-7 text-muted">{row.message}</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted">
              {formatShortDate(row.createdAt)} · {formatArabicTime(row.createdAt)}
            </p>
            <a
              href={whatsappLink(WA_MESSAGES.general, row.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-ok hover:underline"
            >
              الرد عبر واتساب
            </a>
          </div>
        </Card>
      ))}
    </div>
  );
}
