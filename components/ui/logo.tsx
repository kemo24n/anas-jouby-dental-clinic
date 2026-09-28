import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/brand';

/**
 * شعار العيادة — سن مبسّط بتدرّج وردي–بيج داخل حلقة رفيعة.
 */
export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg width="38" height="38" viewBox="0 0 48 48" fill="none" aria-hidden className="shrink-0">
        <circle cx="24" cy="24" r="23" stroke="#C4A27C" strokeWidth="1" opacity=".6" />
        <path
          d="M13 19c0-4.4 4.9-8 11-8s11 3.6 11 8c0 3.2-2 4.9-3.4 8.3-1.2 3-1.5 6.5-3.2 8.4-1.2 1.4-3 1.6-4.4 0-1.7-1.9-2-5.4-3.2-8.4C18.4 23.9 13 22.2 13 19Z"
          fill="url(#clinic-logo)"
        />
        <path d="M19.5 18.5c1.2-1.3 3-2 4.5-2s3.3.7 4.5 2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".85" />
        <defs>
          <linearGradient id="clinic-logo" x1="13" y1="11" x2="35" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A85A72" />
            <stop offset="1" stopColor="#E3B7BF" />
          </linearGradient>
        </defs>
      </svg>
      {showWordmark && (
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight">{BRAND.doctorName}</span>
          <span className="block text-[11px] text-muted">عيادة طب الأسنان — {BRAND.city}</span>
        </span>
      )}
    </span>
  );
}
