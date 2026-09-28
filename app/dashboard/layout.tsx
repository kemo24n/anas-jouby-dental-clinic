import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/session';
import { ToastProvider } from '@/components/ui/toast';
import { DashboardShell } from '@/components/dashboard/shell';

export const metadata: Metadata = {
  title: { default: 'لوحة التحكم', template: '%s | لوحة التحكم' },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole('ADMIN', 'DENTIST', 'RECEPTIONIST');

  return (
    <ToastProvider>
      <DashboardShell role={session.role} name={session.name}>
        {children}
      </DashboardShell>
    </ToastProvider>
  );
}
