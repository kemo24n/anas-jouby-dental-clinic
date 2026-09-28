'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

const base =
  'w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted/70 ' +
  'transition-colors focus:border-orchid-400 focus:outline-none focus:ring-2 focus:ring-orchid-200 disabled:bg-orchid-50/50';

export function Label({ children, htmlFor, required }: { children: React.ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="field-label">
      {children}
      {required && <span className="text-danger"> *</span>}
    </label>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: string }>(
  function Input({ className, error, ...props }, ref) {
    return (
      <>
        <input ref={ref} className={cn(base, error && 'border-danger focus:ring-[#F4CACC]', className)} {...props} />
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </>
    );
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }>(
  function Textarea({ className, error, ...props }, ref) {
    return (
      <>
        <textarea ref={ref} rows={4} className={cn(base, 'leading-7', error && 'border-danger', className)} {...props} />
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </>
    );
  },
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }>(
  function Select({ className, error, children, ...props }, ref) {
    return (
      <>
        <select ref={ref} className={cn(base, 'appearance-none bg-left bg-no-repeat pl-10', error && 'border-danger', className)} {...props}>
          {children}
        </select>
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </>
    );
  },
);

export function Checkbox({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
      <input
        type="checkbox"
        className="h-4.5 w-4.5 rounded border-line text-orchid-500 focus:ring-orchid-300"
        style={{ width: 18, height: 18 }}
        {...props}
      />
      {label}
    </label>
  );
}
