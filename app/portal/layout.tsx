import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/session';
import { ToastProvider } from '@/components/ui/toast';
import { PortalShell } from '@/components/portal/shell';

export const metadata: Metadata = {
  title: { default: 'حسابي', template: '%s | حسابي' },
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole('PATIENT');

  return (
    <ToastProvider>
      <PortalShell name={session.name}>{children}</PortalShell>
    </ToastProvider>
  );
}
