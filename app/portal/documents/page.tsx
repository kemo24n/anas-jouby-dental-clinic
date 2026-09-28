import { requireRole } from '@/lib/auth/session';
import { EmptyState } from '@/components/ui/states';
import { DocumentsView } from '@/components/portal/documents-view';

export const metadata = { title: 'المستندات' };
export const dynamic = 'force-dynamic';

export default async function PortalDocumentsPage() {
  const session = await requireRole('PATIENT');
  if (!session.patientId) return <EmptyState title="لا يوجد ملف مريض مرتبط بحسابك" />;

  return <DocumentsView patientId={session.patientId} />;
}
