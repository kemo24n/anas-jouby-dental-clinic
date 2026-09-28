import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { handleRouteError, ok } from '@/lib/api';

/** GET /api/messages?status= — رسائل التواصل الواردة من الموقع العام. */
export async function GET(request: Request) {
  try {
    const { response } = await guard('messages.read');
    if (response) return response;

    const status = new URL(request.url).searchParams.get('status');
    const messages = await prisma.contactRequest.findMany({
      where: status ? { status: status as never } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return ok(messages);
  } catch (error) {
    return handleRouteError(error);
  }
}
