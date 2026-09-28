'use client';

import * as React from 'react';
import type { ToothCondition } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Label, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { toothConditionColors, toothConditionLabels } from '@/lib/labels';
import { LOWER_LEFT, LOWER_RIGHT, UPPER_LEFT, UPPER_RIGHT, toothName } from '@/lib/teeth';
import { cn, formatShortDate } from '@/lib/utils';

export type ChartRecord = {
  toothNumber: number;
  condition: ToothCondition;
  notes: string | null;
  recordedAt: string;
};

const CONDITIONS = Object.keys(toothConditionLabels) as ToothCondition[];

/**
 * مخطط الأسنان التفاعلي بترقيم FDI.
 * لكل سن لون يعكس حالته، والنقر عليه يفتح تحريراً فورياً مع ملاحظة خاصة به.
 */
export function Odontogram({
  patientId,
  initial,
  canEdit,
}: {
  patientId: string;
  initial: ChartRecord[];
  canEdit: boolean;
}) {
  const toast = useToast();
  const [records, setRecords] = React.useState<Record<number, ChartRecord>>(() =>
    Object.fromEntries(initial.map((record) => [record.toothNumber, record])),
  );
  const [selected, setSelected] = React.useState<number | null>(null);
  const [condition, setCondition] = React.useState<ToothCondition>('HEALTHY');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  function open(toothNumber: number) {
    const current = records[toothNumber];
    setSelected(toothNumber);
    setCondition(current?.condition ?? 'HEALTHY');
    setNotes(current?.notes ?? '');
  }

  async function save() {
    if (selected === null) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/dental-chart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, toothNumber: selected, condition, notes: notes || undefined }),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.push(payload.error ?? 'تعذر حفظ حالة السن.', 'error');
        return;
      }
      setRecords((prev) => ({
        ...prev,
        [selected]: { toothNumber: selected, condition, notes: notes || null, recordedAt: new Date().toISOString() },
      }));
      toast.push(`تم تحديث حالة السن ${selected}.`);
      setSelected(null);
    } catch {
      toast.push('تعذر الاتصال بالخادم.', 'error');
    } finally {
      setSaving(false);
    }
  }

  const rows: { label: string; teeth: number[] }[] = [
    { label: 'الفك العلوي', teeth: [...UPPER_RIGHT, ...UPPER_LEFT] },
    { label: 'الفك السفلي', teeth: [...LOWER_RIGHT, ...LOWER_LEFT] },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-6 overflow-x-auto pb-1">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="mb-2 text-xs font-medium text-muted">{row.label}</p>
            <div className="flex min-w-[640px] gap-1.5">
              {row.teeth.map((number, index) => {
                const record = records[number];
                const tone = toothConditionColors[record?.condition ?? 'HEALTHY'];
                return (
                  <React.Fragment key={number}>
                    {index === 8 && <div className="mx-1 w-px shrink-0 bg-line" aria-hidden />}
                    <button
                      onClick={() => canEdit && open(number)}
                      disabled={!canEdit}
                      title={`${toothName(number)} — ${toothConditionLabels[record?.condition ?? 'HEALTHY']}`}
                      aria-label={`${toothName(number)}، الحالة: ${toothConditionLabels[record?.condition ?? 'HEALTHY']}`}
                      className={cn(
                        'flex h-14 w-10 shrink-0 flex-col items-center justify-center rounded-lg border text-[11px] transition-transform',
                        canEdit && 'hover:-translate-y-0.5 hover:shadow-soft',
                        !canEdit && 'cursor-default',
                      )}
                      style={{ background: tone.fill, borderColor: tone.stroke, color: tone.text }}
                    >
                      <span className="tabular-nums font-medium">{number}</span>
                      {record && record.condition !== 'HEALTHY' && (
                        <span className="mt-0.5 h-1.5 w-1.5 rounded-full" style={{ background: tone.stroke }} />
                      )}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* مفتاح الألوان */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {CONDITIONS.map((item) => (
          <span key={item} className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span
              className="h-3 w-3 rounded border"
              style={{ background: toothConditionColors[item].fill, borderColor: toothConditionColors[item].stroke }}
            />
            {toothConditionLabels[item]}
          </span>
        ))}
      </div>

      {selected !== null && (
        <Modal
          open
          onClose={() => setSelected(null)}
          title={`السن ${selected} — ${toothName(selected)}`}
          footer={
            <>
              <button onClick={() => setSelected(null)} className="h-10 rounded-xl px-4 text-sm text-muted hover:bg-orchid-50">
                تراجع
              </button>
              <Button size="sm" loading={saving} onClick={save}>
                حفظ الحالة
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <Label>الحالة</Label>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((item) => {
                  const tone = toothConditionColors[item];
                  const active = condition === item;
                  return (
                    <button
                      key={item}
                      onClick={() => setCondition(item)}
                      className={cn('rounded-lg border px-3 py-1.5 text-sm', active && 'ring-2 ring-orchid-300')}
                      style={{ background: tone.fill, borderColor: tone.stroke, color: tone.text }}
                    >
                      {toothConditionLabels[item]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="tooth-notes">ملاحظة على هذا السن</Label>
              <Textarea id="tooth-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {records[selected] && (
              <p className="text-xs text-muted">
                آخر تحديث: {formatShortDate(records[selected].recordedAt)}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
