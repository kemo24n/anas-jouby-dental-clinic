import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { serviceSchema } from '@/lib/validation';
import { handleRouteError, ok } from '@/lib/api';
import { audit } from '@/lib/audit';

/** GET — عام: الخدمات المفعّلة مرتبة حسب القسم. */
export async function GET(request: Request) {
  try {
    const includeInactive = new URL(request.url).searchParams.get('all') === '1';
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    return ok(categories);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { session, response } = await guard('services.write');
    if (response) return response;

    const body = serviceSchema.parse(await request.json());
    const slug = body.name.trim().replace(/\s+/g, '-').toLowerCase().slice(0, 60) + '-' + Date.now().toString(36);
    const service = await prisma.service.create({
      data: {
        categoryId: body.categoryId,
        name: body.name,
        slug,
        description: body.description,
        durationMin: body.durationMin,
        startingPrice: body.startingPrice,
        imageUrl: body.imageUrl || null,
        isActive: body.isActive ?? true,
      },
    });

    await audit({ userId: session.sub, action: 'CREATE', entity: 'Service', entityId: service.id, description: `إضافة خدمة: ${service.name}`, request });
    return ok(service, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
