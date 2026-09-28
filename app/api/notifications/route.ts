import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/guard';
import { handleRouteError, ok } from '@/lib/api';

export async function GET() {
  try {
    const { session, response } = await requireAuth();
    if (response) return response;
    const notifications = await prisma.notification.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ok(notifications);
  } catch (error) {
    return handleRouteError(error);
  }
}

const schema = z.object({ id: z.string().uuid().optional(), all: z.boolean().optional() });

/** PATCH — تعليم إشعار أو كل الإشعارات كمقروءة. */
export async function PATCH(request: Request) {
  try {
    const { session, response } = await requireAuth();
    if (response) return response;
    const body = schema.parse(await request.json());

    await prisma.notification.updateMany({
      where: { userId: session.sub, ...(body.id ? { id: body.id } : {}), readAt: null },
      data: { readAt: new Date() },
    });
    return ok({ updated: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
