'use client';
import * as React from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-lift sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="إغلاق" className="rounded-lg p-1.5 text-muted hover:bg-orchid-50 hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

/** حوار تأكيد للإجراءات الحساسة (إلغاء موعد، أرشفة ملف). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'تأكيد',
  onConfirm,
  onClose,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button onClick={onClose} className="h-10 rounded-xl px-4 text-sm text-muted hover:bg-orchid-50">
            تراجع
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-10 rounded-xl bg-danger px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-7 text-muted">{message}</p>
    </Modal>
  );
}
