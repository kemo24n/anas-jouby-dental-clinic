import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/guard';
import { handleRouteError, ok } from '@/lib/api';
import { permissionsFor } from '@/lib/permissions';

export async function GET() {
  try {
    const { session, response } = await requireAuth({ allowMustChangePassword: true });
    if (response) return response;
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, fullName: true, role: true, mustChangePassword: true },
    });
    if (!user) return ok(null);
    return ok({ ...user, permissions: permissionsFor(user.role) });
  } catch (error) {
    return handleRouteError(error);
  }
}
