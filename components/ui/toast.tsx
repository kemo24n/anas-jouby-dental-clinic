'use client';
import * as React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type Toast = { id: number; message: string; tone: 'success' | 'error' };
type ToastContext = { push: (message: string, tone?: Toast['tone']) => void };

const Ctx = React.createContext<ToastContext>({ push: () => undefined });

export function useToast() {
  return React.useContext(Ctx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lift ${
              toast.tone === 'success'
                ? 'border-[#CDE6D8] bg-white text-[#3C6E53]'
                : 'border-[#F4CACC] bg-white text-[#B3363F]'
            }`}
          >
            {toast.tone === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
            <span className="flex-1 leading-6">{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="إغلاق التنبيه"
              className="text-muted hover:text-ink"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
