import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { handleRouteError, ok } from '@/lib/api';

/** GET /api/search?q= — بحث شامل في المرضى والمواعيد. */
export async function GET(request: Request) {
  try {
    const { response } = await guard('patients.read');
    if (response) return response;

    const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
    if (q.length < 2) return ok({ patients: [], appointments: [] });

    const [patients, appointments] = await Promise.all([
      prisma.patient.findMany({
        where: {
          deletedAt: null,
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
            // البحث برقم محلي مثل 0944… يطابق الرقم المخزّن بصيغة 963944…
            ...(phoneDigits(q).length >= 4 ? [{ phone: { contains: phoneDigits(q) } }] : []),
            { code: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 8,
        select: { id: true, code: true, fullName: true, phone: true },
      }),
      prisma.appointment.findMany({
        where: {
          OR: [
            { code: { contains: q, mode: 'insensitive' } },
            { patient: { fullName: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take: 8,
        orderBy: { startsAt: 'desc' },
        select: { id: true, code: true, startsAt: true, status: true, patient: { select: { fullName: true } } },
      }),
    ]);

    return ok({ patients, appointments });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** أرقام الهاتف بدون الصفر المحلي أو رمز الدولة */
function phoneDigits(q: string) {
  return q.replace(/\D/g, '').replace(/^00/, '').replace(/^963/, '').replace(/^0+/, '');
}
