import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { handleRouteError, ok } from '@/lib/api';
import { audit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

/** DELETE — حذف ملاحظة سريرية. */
export async function DELETE(request: Request, props: Params) {
  const { id } = await props.params;
  try {
    const { session, response } = await guard('clinical.write', ['ADMIN']);
    if (response) return response;
    const note = await prisma.clinicalNote.delete({ where: { id } });
    await audit({ userId: session.sub, action: 'DELETE', entity: 'ClinicalNote', entityId: id, patientId: note.patientId, description: 'حذف ملاحظة سريرية', request });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
