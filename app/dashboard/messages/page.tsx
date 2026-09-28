import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/components/dashboard/primitives';
import { MessagesInbox } from '@/components/dashboard/messages-inbox';

export const metadata = { title: 'الرسائل' };
export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  await requireRole('ADMIN', 'DENTIST', 'RECEPTIONIST');

  return (
    <div className="animate-rise">
      <PageHeader title="الرسائل" description="رسائل التواصل الواردة من نموذج الموقع العام." />
      <MessagesInbox />
    </div>
  );
}
