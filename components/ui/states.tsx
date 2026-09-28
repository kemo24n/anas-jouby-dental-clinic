import Link from 'next/link';
import { cn } from '@/lib/utils';

/** حالة فارغة — دعوة للفعل لا مجرد إعلان بعدم وجود بيانات. */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-orchid-400">{icon}</div>}
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-orchid-500 px-5 text-sm font-medium text-white hover:bg-orchid-600"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function SkeletonRows({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-12 w-full" />
      ))}
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-[#F4CACC] bg-[#FDEEEE] px-4 py-3 text-sm text-[#B3363F]">
      {children}
    </p>
  );
}

export function SuccessNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="rounded-xl border border-[#CDE6D8] bg-[#E8F3EC] px-4 py-3 text-sm text-[#417A5C]">
      {children}
    </p>
  );
}
