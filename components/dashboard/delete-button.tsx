'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

/**
 * زر حذف موحّد مع حوار تأكيد. يُستخدم في كل القوائم (المرضى، المواعيد، المدفوعات، الرسائل...).
 * الحذف الفعلي والتحقق من الصلاحية يتمان على الخادم.
 */
export function DeleteButton({
  endpoint,
  title,
  message,
  onDeleted,
  label,
  className,
}: {
  endpoint: string;
  title: string;
  message: string;
  onDeleted?: () => void;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const toast = useToast();

  async function remove() {
    setLoading(true);
    try {
      const response = await fetch(endpoint, { method: 'DELETE' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.push(payload.error ?? 'تعذر الحذف.', 'error');
        return;
      }
      toast.push('تم الحذف.');
      setOpen(false);
      onDeleted?.();
    } catch {
      toast.push('تعذر الاتصال بالخادم.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          setOpen(true);
        }}
        aria-label={label ?? 'حذف'}
        title={label ?? 'حذف'}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg p-1.5 text-sm text-muted transition-colors hover:bg-[#FDEEEE] hover:text-[#B3363F]',
          className,
        )}
      >
        <Trash2 size={15} />
        {label && <span>{label}</span>}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        message={message}
        confirmLabel="حذف نهائياً"
        loading={loading}
        onConfirm={remove}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
