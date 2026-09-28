import { cn } from '@/lib/utils';

export function Section({
  id,
  title,
  lead,
  children,
  className,
  align = 'start',
}: {
  id?: string;
  title?: string;
  lead?: string;
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center';
}) {
  return (
    <section id={id} className={cn('container-page py-16 sm:py-20', className)}>
      {title && (
        <div className={cn('mb-10 max-w-2xl', align === 'center' && 'mx-auto text-center')}>
          <h2 className="text-2xl font-semibold sm:text-[28px]">{title}</h2>
          {lead && <p className="mt-3 text-[15px] leading-8 text-muted">{lead}</p>}
          <span className={cn('mt-5 block h-px w-14 bg-champagne-400', align === 'center' && 'mx-auto')} />
        </div>
      )}
      {children}
    </section>
  );
}
