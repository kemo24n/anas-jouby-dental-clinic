import { z } from 'zod';
import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { handleRouteError, ok } from '@/lib/api';
import { audit } from '@/lib/audit';

const schema = z.object({ status: z.enum(['NEW', 'IN_PROGRESS', 'ANSWERED', 'CLOSED']) });
type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('messages.read');
    if (response) return response;

    const body = schema.parse(await request.json());
    const updated = await prisma.contactRequest.update({
      where: { id: params.id },
      data: { status: body.status, handledAt: body.status === 'NEW' ? null : new Date() },
    });

    await audit({ userId: session.sub, action: 'UPDATE', entity: 'ContactRequest', entityId: updated.id, description: 'تحديث حالة رسالة تواصل', request });
    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE — حذف الرسالة نهائياً. */
export async function DELETE(request: Request, props: Params) {
  const { id } = await props.params;
  try {
    const { session, response } = await guard('messages.read', ['ADMIN']);
    if (response) return response;
    await prisma.contactRequest.delete({ where: { id } });
    await audit({ userId: session.sub, action: 'DELETE', entity: 'ContactRequest', entityId: id, description: 'حذف رسالة تواصل', request });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
