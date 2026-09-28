import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { handleRouteError, ok } from '@/lib/api';
import { audit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

/** DELETE — حذف دفعة (تختفي من الرصيد والتقارير). */
export async function DELETE(request: Request, props: Params) {
  const { id } = await props.params;
  try {
    const { session, response } = await guard('payments.write', ['ADMIN']);
    if (response) return response;
    const payment = await prisma.payment.delete({ where: { id } });
    await audit({
      userId: session.sub, action: 'DELETE', entity: 'Payment', entityId: id, patientId: payment.patientId,
      description: `حذف دفعة بقيمة ${Number(payment.amount)}`, request,
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
