import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { serviceSchema } from '@/lib/validation';
import { handleRouteError, ok } from '@/lib/api';
import { audit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, props: Params) {
  const params = await props.params;
  try {
    const { session, response } = await guard('services.write');
    if (response) return response;

    const body = serviceSchema.partial().parse(await request.json());
    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.categoryId ? { categoryId: body.categoryId } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.durationMin ? { durationMin: body.durationMin } : {}),
        ...(body.startingPrice !== undefined ? { startingPrice: body.startingPrice } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl || null } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });

    await audit({ userId: session.sub, action: 'UPDATE', entity: 'Service', entityId: service.id, description: `تعديل خدمة: ${service.name}`, request });
    return ok(service);
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * DELETE — حذف خدمة نهائياً. المواعيد السابقة لهذه الخدمة تبقى محفوظة
 * (يصبح حقل الخدمة فيها فارغاً).
 */
export async function DELETE(request: Request, props: Params) {
  const { id } = await props.params;
  try {
    const { session, response } = await guard('services.write', ['ADMIN']);
    if (response) return response;
    const service = await prisma.service.delete({ where: { id } });
    await audit({ userId: session.sub, action: 'DELETE', entity: 'Service', entityId: id, description: `حذف الخدمة: ${service.name}`, request });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
