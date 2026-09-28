import Link from 'next/link';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  href,
  tone = 'orchid',
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: 'orchid' | 'rose' | 'gold' | 'ok' | 'danger';
}) {
  const tones = {
    orchid: 'text-orchid-600 bg-orchid-50',
    rose: 'text-rose-600 bg-rose-50',
    gold: 'text-champagne-600 bg-champagne-100',
    ok: 'text-[#417A5C] bg-[#E8F3EC]',
    danger: 'text-[#B3363F] bg-[#FDEEEE]',
  } as const;

  const content = (
    <div className="card h-full px-5 py-4 transition-shadow hover:shadow-lift">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && (
        <span className={cn('mt-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-medium', tones[tone])}>
          {hint}
        </span>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

/** جدول متجاوب: يتحول إلى تمرير أفقي على الشاشات الصغيرة. */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="table-scroll">
      <table className="w-full min-w-[640px] border-collapse text-right text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn('border-b border-line px-4 py-3 text-xs font-medium text-muted', className)}>{children}</th>
  );
}

export function Td({
  children,
  className,
  colSpan,
  dir,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  dir?: 'ltr' | 'rtl' | 'auto';
}) {
  return (
    <td colSpan={colSpan} dir={dir} className={cn('border-b border-line px-4 py-3 align-middle', className)}>
      {children}
    </td>
  );
}
