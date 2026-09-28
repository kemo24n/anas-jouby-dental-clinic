'use client';

import * as React from 'react';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorNote, SkeletonRows } from '@/components/ui/states';
import { formatArabicTime, formatShortDate } from '@/lib/utils';

type Note = {
  id: string;
  content: string;
  diagnosis: string | null;
  treatment: string | null;
  createdAt: string;
  dentist: { fullName: string } | null;
  patient: { id: string; code: string; fullName: string };
};

export function ClinicalRecordsFeed() {
  const [rows, setRows] = React.useState<Note[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/clinical-notes')
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok) {
          setError(payload.error ?? 'تعذر تحميل السجلات.');
          setRows([]);
          return;
        }
        setRows(payload.data);
      })
      .catch(() => {
        setError('تعذر الاتصال بالخادم.');
        setRows([]);
      });
  }, []);

  return (
    <div className="space-y-4">
      {error && <ErrorNote>{error}</ErrorNote>}
      {rows === null && <SkeletonRows rows={6} />}

      {rows !== null && rows.length === 0 && !error && (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title="لا توجد ملاحظات سريرية بعد"
          description="تُضاف الملاحظات السريرية من تبويب «الملاحظات» داخل ملف كل مريض."
        />
      )}

      {rows?.map((note) => (
        <Card key={note.id} className="px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Link href={`/dashboard/patients/${note.patient.id}`} className="font-medium hover:text-orchid-600">
              {note.patient.fullName}
            </Link>
            <p className="text-xs text-muted">
              {note.dentist?.fullName ?? 'العيادة'} · {formatShortDate(note.createdAt)} · {formatArabicTime(note.createdAt)}
            </p>
          </div>
          <p className="mt-2 text-sm leading-7">{note.content}</p>
          {(note.diagnosis || note.treatment) && (
            <div className="mt-2 flex flex-wrap gap-x-6 text-xs text-muted">
              {note.diagnosis && <span>التشخيص: {note.diagnosis}</span>}
              {note.treatment && <span>العلاج: {note.treatment}</span>}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
